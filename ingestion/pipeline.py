"""
Pipeline V2 — Async-first ingestion engine with:
  - Circuit Breaker for Gemini API resilience
  - asyncio.Queue worker pool (3 concurrent LLM workers)
  - Semantic deduplication via pgvector cosine similarity
  - Source community tracking + ecosystem-aware dependency extraction
"""
import os
import json
import psycopg2
import uuid
import time
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types
from curl_cffi import requests as cffi_requests

from scrapers import get_all_scraped_data

load_dotenv()

GITHUB_TOKEN = os.getenv("GH_GRAPHQL_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DB_URL = os.getenv("DATABASE_URL")

# Pipeline configuration
NUM_WORKERS = 3
SEMANTIC_DEDUP_THRESHOLD = 0.90  # Cosine similarity threshold for merging


# =============================================================================
# CIRCUIT BREAKER — Tri-state fault tolerance for API calls
# =============================================================================

class CircuitBreaker:
    """Tri-state circuit breaker: CLOSED → OPEN → HALF_OPEN → CLOSED.
    Prevents cascading failures when Gemini API is rate-limited or down."""

    def __init__(self, failure_threshold=3, recovery_timeout=60):
        self.state = "CLOSED"
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.last_failure_time = 0
        self.total_trips = 0

    async def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            elapsed = time.time() - self.last_failure_time
            if elapsed > self.recovery_timeout:
                print(f"  >> Circuit HALF_OPEN -- probing with 1 request...")
                self.state = "HALF_OPEN"
            else:
                remaining = self.recovery_timeout - elapsed
                raise CircuitOpenError(f"Circuit OPEN — cooling down ({remaining:.0f}s remaining)")

        try:
            result = await asyncio.get_event_loop().run_in_executor(None, lambda: func(*args, **kwargs))
            if self.state == "HALF_OPEN":
                print(f"  OK Probe succeeded -- circuit CLOSED")
                self.state = "CLOSED"
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                self.total_trips += 1
                print(f"  [!] Circuit OPEN -- {self.failure_threshold} consecutive failures (trip #{self.total_trips})")
            raise

class CircuitOpenError(Exception):
    pass


# =============================================================================
# GEMINI LLM FUNCTIONS
# =============================================================================

def parse_with_gemini_sync(scraped_item, client):
    """Synchronous Gemini call with model fallback (2.5-pro -> 2.5-flash)."""
    prompt = f"""
    Analyze this raw extracted developer forum data. Determine if it contains a valid software pain point or feature request.
    If it DOES, extract and categorize it into a JSON object matching this exact schema:
    {{
        "title": "String (Short, punchy project name -- NOT the original post title, but a rewritten actionable tool/product name)",
        "description": "String (Clear problem statement and proposed solution, 2-4 sentences)",
        "difficulty": "String (Beginner, Intermediate, Advanced)",
        "devTime": "String (e.g., '1-2 weeks', '2-3 months')",
        "domain": "String (e.g., 'Web Development', 'DevOps', 'Data Science', 'Mobile', 'Security', 'AI/ML', 'Database', 'CLI Tools')",
        "recommendedStack": ["String", "String"],
        "tags": ["String", "String"],
        "fragileDependencies": [
            {{"name": "string (lowercase package name)", "ecosystem": "string (npm, pip, cargo, go, gem, or unknown)"}}
        ]
    }}
    If it DOES NOT contain a valid software idea (it's just conversational noise, a tutorial, a generic question, or an error log without a clear tool idea), return an empty JSON object: {{}}
    
    Raw Title: {scraped_item.get('title', '')}
    Raw Body: {scraped_item.get('bodyText', '')[:3000]}
    """

    # Model fallback chain: 2.5-pro -> 2.5-flash -> 2.0-flash (1,500 requests/day limit)
    models = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']
    
    for model in models:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            error_str = str(e)
            if 'RESOURCE_EXHAUSTED' in error_str or '429' in error_str:
                if model == models[-1]:
                    raise  # Last model in chain, propagate
                print(f"    {model} quota exhausted, falling back to next model...")
                continue
            raise  # Non-quota error, propagate immediately


def generate_embedding_sync(text, client):
    """Synchronous embedding call."""
    resp = client.models.embed_content(
        model='gemini-embedding-001',
        contents=text,
    )
    return resp.embeddings[0].values


# =============================================================================
# DATABASE FUNCTIONS
# =============================================================================

def get_existing_urls(conn):
    """Fetches all existing source URLs from the database to prevent duplicate LLM processing."""
    cur = conn.cursor()
    try:
        cur.execute('SELECT "sourceUrl" FROM "Idea" WHERE "sourceUrl" IS NOT NULL')
        urls = {row[0] for row in cur.fetchall()}
        conn.commit()
        return urls
    except Exception as e:
        conn.rollback()
        print(f"Failed to fetch existing URLs: {e}")
        return set()
    finally:
        cur.close()


def check_semantic_duplicate(conn, embedding_result):
    """Checks if a semantically similar idea already exists (cosine > threshold).
    Returns (idea_id, similarity) if found, (None, 0) otherwise."""
    if not embedding_result or len(embedding_result) != 3072:
        return None, 0

    cur = conn.cursor()
    try:
        formatted = f"[{','.join(map(str, embedding_result))}]"
        cur.execute("""
            SELECT id, title, 1 - (embedding <=> %s::vector) as similarity
            FROM "Idea"
            WHERE embedding IS NOT NULL
            ORDER BY similarity DESC
            LIMIT 1;
        """, (formatted,))
        row = cur.fetchone()
        conn.commit()
        if row and row[2] > SEMANTIC_DEDUP_THRESHOLD:
            return row[0], row[2]
        return None, 0
    except Exception as e:
        conn.rollback()
        return None, 0
    finally:
        cur.close()


def merge_into_existing(conn, existing_id, community, source_url):
    """Merges a duplicate into an existing idea by incrementing mentionCount and appending source."""
    cur = conn.cursor()
    try:
        # Append community to sourceCommunities array if not already present
        cur.execute("""
            UPDATE "Idea" 
            SET "mentionCount" = "mentionCount" + 1,
                "sourceCommunities" = CASE 
                    WHEN NOT (%s = ANY("sourceCommunities")) 
                    THEN array_append("sourceCommunities", %s)
                    ELSE "sourceCommunities"
                END,
                "lastReportedAt" = NOW(),
                "updatedAt" = NOW()
            WHERE id = %s
        """, (community, community, existing_id))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"  Merge error: {e}")
        return False
    finally:
        cur.close()


def insert_into_db(parsed_data, source_url, conn, community="Unknown", embedding_result=None, oldest_date=None, newest_date=None):
    """Inserts a new Idea with all enrichment data."""
    cur = conn.cursor()
    try:
        idea_id = f"c_{uuid.uuid4().hex[:23]}"
        first_rep = oldest_date if oldest_date else None
        last_rep = newest_date if newest_date else None
        source_communities = [community] if community and community != "Unknown" else []

        cur.execute("""
            INSERT INTO "Idea" (id, title, description, "sourceUrl", difficulty, "devTime", domain, "recommendedStack", "sourceCommunities", "mentionCount", "firstReportedAt", "lastReportedAt", "createdAt", "updatedAt", status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1, %s, %s, NOW(), NOW(), 'OPEN')
            RETURNING id;
        """, (
            idea_id,
            parsed_data.get('title') or 'Untitled Idea',
            parsed_data.get('description') or '',
            source_url,
            parsed_data.get('difficulty') or 'Intermediate',
            parsed_data.get('devTime') or '1-2 weeks',
            parsed_data.get('domain') or 'General',
            parsed_data.get('recommendedStack') or [],
            source_communities,
            first_rep, last_rep
        ))

        # Inject vector embedding
        if embedding_result and len(embedding_result) == 3072:
            formatted = f"[{','.join(map(str, embedding_result))}]"
            cur.execute('UPDATE "Idea" SET embedding = %s::vector WHERE id = %s', (formatted, idea_id))

        # Process Tags
        for tag_name in (parsed_data.get('tags') or []):
            tag_name = tag_name.lower().strip()
            if not tag_name:
                continue
            cur.execute("""
                INSERT INTO "Tag" (id, name) VALUES (%s, %s)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id;
            """, (f"t_{uuid.uuid4().hex[:23]}", tag_name))
            tag_id = cur.fetchone()[0]
            cur.execute('INSERT INTO "IdeaTag" ("ideaId", "tagId") VALUES (%s, %s) ON CONFLICT DO NOTHING;', (idea_id, tag_id))

        # Process Fragile Dependencies (with ecosystem)
        for dep in (parsed_data.get('fragileDependencies') or []):
            if isinstance(dep, dict):
                dep_name = str(dep.get('name', '')).lower().strip()
                dep_eco = str(dep.get('ecosystem', 'unknown')).lower().strip()
            else:
                dep_name = str(dep).lower().strip()
                dep_eco = 'unknown'
            if not dep_name:
                continue

            valid_ecos = {'npm', 'pip', 'cargo', 'go', 'gem', 'nuget', 'maven', 'unknown'}
            if dep_eco not in valid_ecos:
                dep_eco = 'unknown'

            cur.execute("""
                INSERT INTO "FragileDependency" (id, name, ecosystem, "complaintCount", "lastReportedAt")
                VALUES (%s, %s, %s, 1, NOW())
                ON CONFLICT (name) DO UPDATE SET 
                  "complaintCount" = "FragileDependency"."complaintCount" + 1,
                  "lastReportedAt" = NOW(),
                  ecosystem = CASE 
                    WHEN "FragileDependency".ecosystem = 'unknown' AND %s != 'unknown' THEN %s 
                    ELSE "FragileDependency".ecosystem 
                  END;
            """, (f"fd_{uuid.uuid4().hex[:22]}", dep_name, dep_eco, dep_eco, dep_eco))

        conn.commit()
        return True

    except Exception as e:
        conn.rollback()
        print(f"  [ERR] DB Error: {e}")
        return False
    finally:
        cur.close()


def get_historical_dates(query_string):
    """Uses GitHub REST Search API to find the oldest and newest occurrences of a problem."""
    if not GITHUB_TOKEN or GITHUB_TOKEN == "your_github_pat":
        return None, None
    try:
        keywords = "+".join(query_string.split()[:5])
        url = f"https://api.github.com/search/issues?q={keywords}&sort=created"
        headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}

        resp_asc = cffi_requests.get(url + "&order=asc", headers=headers, impersonate="chrome120")
        oldest = None
        if resp_asc.status_code == 200:
            items = resp_asc.json().get('items', [])
            if items:
                oldest = items[0].get('created_at')

        resp_desc = cffi_requests.get(url + "&order=desc", headers=headers, impersonate="chrome120")
        newest = None
        if resp_desc.status_code == 200:
            items = resp_desc.json().get('items', [])
            if items:
                newest = items[0].get('created_at')

        return oldest, newest
    except Exception as e:
        return None, None


# =============================================================================
# ASYNC WORKER — Processes items from the queue
# =============================================================================

async def worker(name, queue, conn, client, breaker, stats):
    """Async worker that consumes items from the queue and processes them through LLM → Embed → DB."""
    while True:
        item = await queue.get()
        if item is None:
            queue.task_done()
            break

        title_short = (item.get('title') or '')[:60]
        community = item.get('community', 'Unknown')

        try:
            # Step 1: Parse with Gemini (through circuit breaker)
            await asyncio.sleep(1.5)  # Rate limit spacing
            parsed_json = await breaker.call(parse_with_gemini_sync, item, client)

            if not parsed_json or "title" not in parsed_json:
                stats['noise'] += 1
                queue.task_done()
                continue

            # Step 2: Generate embedding
            text_to_embed = f"{parsed_json.get('title', '')}. {parsed_json.get('description', '')}"
            embedding_result = None
            try:
                embedding_result = await asyncio.get_event_loop().run_in_executor(
                    None, generate_embedding_sync, text_to_embed, client
                )
            except Exception as emb_e:
                print(f"  [{name}] Embedding failed: {emb_e}")

            # Step 3: Semantic deduplication
            existing_id, similarity = check_semantic_duplicate(conn, embedding_result)
            if existing_id:
                merge_into_existing(conn, existing_id, community, item.get('url'))
                stats['merged'] += 1
                print(f"  [{name}] [MERGED] into existing (sim={similarity:.2f}): {title_short}")
                queue.task_done()
                continue

            # Step 4: Historical enrichment
            oldest, newest = None, None
            try:
                oldest, newest = await asyncio.get_event_loop().run_in_executor(
                    None, get_historical_dates, parsed_json.get('title', '')
                )
            except:
                pass

            # Step 5: Insert
            success = insert_into_db(parsed_json, item.get('url'), conn, community, embedding_result, oldest, newest)
            if success:
                stats['inserted'] += 1
                print(f"  [{name}] [OK] Inserted: {parsed_json.get('title', '')[:60]}")
            else:
                stats['failed'] += 1

        except CircuitOpenError as e:
            # Circuit is open -- if we've tripped too many times, the quota is dead. Drain and exit.
            if breaker.total_trips >= 5:
                print(f"  [{name}] Circuit tripped {breaker.total_trips} times -- API quota exhausted. Draining queue.")
                queue.task_done()
                # Drain remaining items from the queue
                while not queue.empty():
                    try:
                        discard = queue.get_nowait()
                        queue.task_done()
                    except asyncio.QueueEmpty:
                        break
                break
            stats['requeued'] += 1
            await queue.put(item)
            await asyncio.sleep(15)

        except Exception as e:
            stats['failed'] += 1
            print(f"  [{name}] [ERR] Failed: {title_short} -- {e}")

        queue.task_done()


# =============================================================================
# MAIN PIPELINE ORCHESTRATOR
# =============================================================================

async def run_pipeline_async():
    if not GEMINI_API_KEY:
        print("FATAL: GEMINI_API_KEY is not configured.")
        return

    try:
        conn = psycopg2.connect(DB_URL)
    except Exception as e:
        print(f"FATAL: Database connection failed: {e}")
        return

    try:
        # Phase 1: Async extraction
        scraped_items = await get_all_scraped_data(GITHUB_TOKEN)

        if not scraped_items:
            print("No items scraped. Check network or tokens.")
            return

        # Phase 2: URL deduplication
        existing_urls = get_existing_urls(conn)
        new_items = [item for item in scraped_items if item.get('url') and item.get('url') not in existing_urls]

        print(f"\nScraped {len(scraped_items)} total. Filtered {len(scraped_items) - len(new_items)} existing URLs.")
        if not new_items:
            print("No new unique items. Exiting.")
            return

        # Filter items with no body text
        new_items = [item for item in new_items if item.get('bodyText')]
        print(f"Processing {len(new_items)} items through {NUM_WORKERS} async workers...\n")

        # Phase 3: Worker pool with circuit breaker
        client = genai.Client(api_key=GEMINI_API_KEY)
        breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=60)
        queue = asyncio.Queue(maxsize=500)
        stats = {'inserted': 0, 'merged': 0, 'noise': 0, 'failed': 0, 'requeued': 0}

        # Fill the queue
        for item in new_items:
            await queue.put(item)

        # Add poison pills for graceful shutdown
        for _ in range(NUM_WORKERS):
            await queue.put(None)

        # Launch workers
        workers = [asyncio.create_task(worker(f"W{i+1}", queue, conn, client, breaker, stats)) for i in range(NUM_WORKERS)]
        await asyncio.gather(*workers)

        # Summary
        print(f"\n{'=' * 60}")
        print(f"PIPELINE V2 COMPLETE")
        print(f"  Inserted:   {stats['inserted']}")
        print(f"  Merged:     {stats['merged']} (semantic duplicates → mentionCount++)")
        print(f"  Noise:      {stats['noise']} (LLM rejected)")
        print(f"  Failed:     {stats['failed']}")
        print(f"  Requeued:   {stats['requeued']} (circuit breaker recoveries)")
        if breaker.total_trips > 0:
            print(f"  CB Trips:   {breaker.total_trips}")
        print(f"{'=' * 60}")

    finally:
        if conn:
            conn.close()
            print("Database connection closed.")


def run_pipeline():
    """Entry point — bridges sync execution into the async pipeline."""
    asyncio.run(run_pipeline_async())


if __name__ == "__main__":
    run_pipeline()
