"""
Local Hardware Queue Poller
Pulls raw extracted payloads from the Cloud Redis queue (dp:raw_payloads),
runs heavy Gemini AI triage/structuring locally, generates pgvector embeddings,
and performs semantic deduplication before inserting into PostgreSQL.
"""
import os
import json
import time
import uuid
import asyncio
import psycopg2
import redis.asyncio as redis
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load local environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DB_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

SEMANTIC_DEDUP_THRESHOLD = 0.90  # Cosine similarity threshold for merging

# =============================================================================
# CIRCUIT BREAKER
# =============================================================================
class CircuitBreaker:
    def __init__(self, failure_threshold=3, recovery_timeout=60):
        self.state = "CLOSED"
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.last_failure_time = 0

    async def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            elapsed = time.time() - self.last_failure_time
            if elapsed > self.recovery_timeout:
                self.state = "HALF_OPEN"
            else:
                raise CircuitOpenError(f"Circuit OPEN — cooling down")

        try:
            result = await asyncio.get_event_loop().run_in_executor(None, lambda: func(*args, **kwargs))
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
            raise

class CircuitOpenError(Exception):
    pass


# =============================================================================
# GEMINI LLM FUNCTIONS
# =============================================================================
def parse_with_gemini_sync(raw_text, title, client):
    prompt = f"""
    Analyze this raw extracted developer forum/review data. Determine if it contains a valid software pain point or feature request.
    If it DOES, extract and categorize it into a JSON object matching this schema:
    {{
        "title": "String (Short, punchy project name -- NOT the original title, but a rewritten actionable tool name)",
        "description": "String (Clear problem statement and proposed solution, 2-4 sentences)",
        "difficulty": "String (Beginner, Intermediate, Advanced)",
        "devTime": "String (e.g., '1-2 weeks', '2-3 months')",
        "domain": "String (e.g., 'Web Development', 'DevOps', 'Data Science', 'Mobile', 'Security')",
        "recommendedStack": ["String", "String"],
        "tags": ["String", "String"],
        "fragileDependencies": [
            {{"name": "string (package name)", "ecosystem": "string (npm, pip, cargo, go, gem, unknown)"}}
        ]
    }}
    If it DOES NOT contain a valid software idea (just noise/spam), return an empty JSON object: {{}}
    
    Raw Title: {title}
    Raw Body: {raw_text[:4000]}
    """
    models = ['gemini-3.5-flash', 'gemma-4-31b', 'gemini-3-flash']
    for model in models:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            return json.loads(response.text)
        except Exception as e:
            if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                if model == models[-1]: raise
                continue
            raise

def generate_embedding_sync(text, client):
    resp = client.models.embed_content(model='gemini-embedding-001', contents=text)
    return resp.embeddings[0].values


# =============================================================================
# DATABASE FUNCTIONS
# =============================================================================
def check_semantic_duplicate(conn, embedding_result):
    if not embedding_result or len(embedding_result) != 3072: return None, 0
    cur = conn.cursor()
    try:
        formatted = f"[{','.join(map(str, embedding_result))}]"
        cur.execute("""
            SELECT id, 1 - (embedding <=> %s::vector) as similarity
            FROM "Idea"
            WHERE embedding IS NOT NULL
            ORDER BY similarity DESC LIMIT 1;
        """, (formatted,))
        row = cur.fetchone()
        conn.commit()
        if row and row[1] > SEMANTIC_DEDUP_THRESHOLD:
            return row[0], row[1]
        return None, 0
    except Exception:
        conn.rollback()
        return None, 0
    finally:
        cur.close()

def merge_into_existing(conn, existing_id, community):
    cur = conn.cursor()
    try:
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
    except Exception:
        conn.rollback()
        return False
    finally:
        cur.close()

def insert_into_db(parsed_data, source_url, conn, community, embedding_result, extracted_at):
    cur = conn.cursor()
    try:
        idea_id = f"c_{uuid.uuid4().hex[:23]}"
        cur.execute("""
            INSERT INTO "Idea" (id, title, description, "sourceUrl", difficulty, "devTime", domain, "recommendedStack", "sourceCommunities", "mentionCount", "firstReportedAt", "lastReportedAt", "createdAt", "updatedAt", status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1, %s, %s, NOW(), NOW(), 'OPEN')
        """, (
            idea_id,
            parsed_data.get('title') or 'Untitled Idea',
            parsed_data.get('description') or '',
            source_url,
            parsed_data.get('difficulty') or 'Intermediate',
            parsed_data.get('devTime') or '1-2 weeks',
            parsed_data.get('domain') or 'General',
            parsed_data.get('recommendedStack') or [],
            [community],
            extracted_at, extracted_at
        ))

        if embedding_result and len(embedding_result) == 3072:
            formatted = f"[{','.join(map(str, embedding_result))}]"
            cur.execute('UPDATE "Idea" SET embedding = %s::vector WHERE id = %s', (formatted, idea_id))

        for tag_name in (parsed_data.get('tags') or []):
            tag_name = tag_name.lower().strip()
            if not tag_name: continue
            cur.execute("""
                INSERT INTO "Tag" (id, name) VALUES (%s, %s)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id;
            """, (f"t_{uuid.uuid4().hex[:23]}", tag_name))
            tag_id = cur.fetchone()[0]
            cur.execute('INSERT INTO "IdeaTag" ("ideaId", "tagId") VALUES (%s, %s) ON CONFLICT DO NOTHING;', (idea_id, tag_id))

        for dep in (parsed_data.get('fragileDependencies') or []):
            dep_name = str(dep.get('name', '') if isinstance(dep, dict) else dep).lower().strip()
            dep_eco = str(dep.get('ecosystem', 'unknown') if isinstance(dep, dict) else 'unknown').lower().strip()
            if not dep_name: continue
            if dep_eco not in {'npm', 'pip', 'cargo', 'go', 'gem', 'nuget', 'maven', 'unknown'}: dep_eco = 'unknown'

            cur.execute("""
                INSERT INTO "FragileDependency" (id, name, ecosystem, "complaintCount", "lastReportedAt")
                VALUES (%s, %s, %s, 1, NOW())
                ON CONFLICT (name) DO UPDATE SET 
                  "complaintCount" = "FragileDependency"."complaintCount" + 1,
                  "lastReportedAt" = NOW(),
                  ecosystem = CASE WHEN "FragileDependency".ecosystem = 'unknown' AND %s != 'unknown' THEN %s ELSE "FragileDependency".ecosystem END;
            """, (f"fd_{uuid.uuid4().hex[:22]}", dep_name, dep_eco, dep_eco, dep_eco))

        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"  [ERR] DB Error: {e}")
        return False
    finally:
        cur.close()


# =============================================================================
# QUEUE POLLER
# =============================================================================
async def process_payload(payload_str, conn, client, breaker):
    try:
        data = json.loads(payload_str)
        source = data.get("source", "Unknown")
        target_url = data.get("target_url")
        raw_content = data.get("raw_content", "")
        extracted_at = data.get("extracted_at")

        if not raw_content:
            return False

        print(f"\n[Processing] Source: {source} | URL: {target_url}")
        
        # 1. Parse via Gemini
        parsed_json = await breaker.call(parse_with_gemini_sync, raw_content, target_url, client)
        
        # Safe RPM rate limiting
        rate_limit_delay = int(os.getenv("RATE_LIMIT_DELAY", "15"))
        await asyncio.sleep(rate_limit_delay)

        if not parsed_json or "title" not in parsed_json:
            print("  -> Noise rejected by LLM")
            return True # Attempt was made

        title_short = parsed_json.get('title', '')[:60]
        text_to_embed = f"{parsed_json.get('title', '')}. {parsed_json.get('description', '')}"

        # 2. Embed
        embedding_result = await asyncio.get_event_loop().run_in_executor(None, generate_embedding_sync, text_to_embed, client)
        
        # Safe RPM rate limiting
        await asyncio.sleep(rate_limit_delay)

        # 3. Deduplicate
        existing_id, similarity = check_semantic_duplicate(conn, embedding_result)
        if existing_id:
            merge_into_existing(conn, existing_id, source)
            print(f"  -> [MERGED] (sim={similarity:.2f}): {title_short}")
            return True

        # 4. Insert
        success = insert_into_db(parsed_json, target_url, conn, source, embedding_result, extracted_at)
        if success:
            print(f"  -> [INSERTED]: {title_short}")
        else:
            print(f"  -> [FAILED DB INSERT]")
        
        return True

    except Exception as e:
        print(f"  [Error] Failed to process payload: {e}")
        return False


async def run_poller():
    if not GEMINI_API_KEY or not DB_URL:
        print("FATAL: Missing GEMINI_API_KEY or DATABASE_URL")
        return

    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    conn = psycopg2.connect(DB_URL)
    genai_client = genai.Client(api_key=GEMINI_API_KEY)
    breaker = CircuitBreaker()

    max_payloads = int(os.getenv("MAX_PAYLOADS_PER_RUN", "3"))
    processed_count = 0

    print(f"[*] Started Local Queue Poller")
    print(f"[*] Listening on Redis queue: dp:raw_payloads (Cap: {max_payloads} items/run)")

    try:
        while processed_count < max_payloads:
            try:
                # BLPOP blocks until a payload is available or timeout hits
                result = await redis_client.blpop("dp:raw_payloads", timeout=30)
                if result:
                    _, payload_str = result
                    success = await process_payload(payload_str, conn, genai_client, breaker)
                    if success:
                        processed_count += 1
                        print(f"[*] Progress: {processed_count}/{max_payloads} payloads processed in this run.")
            except redis.ConnectionError:
                print("Redis connection error. Retrying in 5s...")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"Unexpected poller error: {e}")
                await asyncio.sleep(1)
        
        print(f"\n[*] Reached maximum payloads limit per run ({max_payloads}). Exiting gracefully to protect API quota.")
    finally:
        conn.close()
        await redis_client.aclose()


if __name__ == "__main__":
    asyncio.run(run_poller())
