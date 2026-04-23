import os
import json
import psycopg2
import uuid
import time
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types
from curl_cffi import requests as cffi_requests

# Import our new multi-source scrapers
from scrapers import get_all_scraped_data

load_dotenv()

GITHUB_TOKEN = os.getenv("GH_GRAPHQL_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DB_URL = os.getenv("DATABASE_URL")

def get_historical_dates(query_string):
    """Uses GitHub REST Search API to find the oldest and newest occurrences of a problem."""
    if not GITHUB_TOKEN or GITHUB_TOKEN == "your_github_pat": return None, None
    try:
        # Take first 5 words as keywords to avoid query too long errors
        keywords = "+".join(query_string.split()[:5]) 
        url = f"https://api.github.com/search/issues?q={keywords}&sort=created"
        headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
        
        # Ascending (Oldest)
        resp_asc = cffi_requests.get(url + "&order=asc", headers=headers, impersonate="chrome120")
        oldest = None
        if resp_asc.status_code == 200:
            items = resp_asc.json().get('items', [])
            if items: oldest = items[0].get('created_at')

        # Descending (Newest)
        resp_desc = cffi_requests.get(url + "&order=desc", headers=headers, impersonate="chrome120")
        newest = None
        if resp_desc.status_code == 200:
            items = resp_desc.json().get('items', [])
            if items: newest = items[0].get('created_at')

        return oldest, newest
    except Exception as e:
        print(f"Historical fetch error: {e}")
        return None, None

def parse_with_gemini(scraped_item):
    """Passes raw text to Gemini 2.5 Pro with a strict JSON schema prompt."""
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    prompt = f"""
    Analyze this raw extracted developer forum data. Determine if it contains a valid software pain point or feature request.
    If it DOES, extract and categorize it into a JSON object matching this exact schema:
    {{
        "title": "String (Short, punchy project name)",
        "description": "String (Clear problem statement and proposed solution)",
        "difficulty": "String (Beginner, Intermediate, Advanced)",
        "devTime": "String (e.g., '1-2 weeks')",
        "domain": "String (e.g., 'Web Development', 'DevOps', 'Data Science')",
        "recommendedStack": ["String", "String"],
        "tags": ["String", "String"],
        "fragileDependencies": ["String"] // Identify specific open-source libraries or frameworks (e.g., 'prisma', 'react-router', 'pandas') that are the root cause of the complaint. Return as array of lowercase strings.
    }}
    If it DOES NOT contain a valid software idea (it's just conversational noise or an error log without a tool idea), return an empty JSON object: {{}}
    
    Raw Title: {scraped_item.get('title', '')}
    Raw Body: {scraped_item.get('bodyText', '')}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    except json.JSONDecodeError:
        print("Failed to decode JSON from Gemini. Skipping item.")
        return None
    except Exception as e:
        print(f"Gemini parsing error: {e}")
        return None

def insert_into_db(parsed_data, source_url, conn, embedding_result=None, oldest_date=None, newest_date=None):
    """Inserts parsed Idea and handles Tag relations in PostgreSQL."""
    cur = conn.cursor()
    try:
        idea_id = f"c_{uuid.uuid4().hex[:23]}" 
        
        # Convert ISO strings to proper Postgres TIMESTAMPTZ if they exist
        first_rep = oldest_date if oldest_date else None
        last_rep = newest_date if newest_date else None
        
        cur.execute("""
            INSERT INTO "Idea" (id, title, description, "sourceUrl", difficulty, "devTime", domain, "recommendedStack", "firstReportedAt", "lastReportedAt", "createdAt", "updatedAt", status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), 'OPEN')
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
            first_rep,
            last_rep
        ))

        # Inject vector embedding if available
        if embedding_result and len(embedding_result) == 3072:
            formatted_embedding = f"[{','.join(map(str, embedding_result))}]"
            cur.execute("""
                UPDATE "Idea" 
                SET embedding = %s::vector 
                WHERE id = %s
            """, (formatted_embedding, idea_id))
        
        # Process Tags
        tags = parsed_data.get('tags') or []
        for tag_name in tags:
            tag_name = tag_name.lower().strip()
            if not tag_name: continue
            
            cur.execute("""
                INSERT INTO "Tag" (id, name) VALUES (%s, %s)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id;
            """, (f"t_{uuid.uuid4().hex[:23]}", tag_name))
            tag_id = cur.fetchone()[0]
            
            cur.execute("""
                INSERT INTO "IdeaTag" ("ideaId", "tagId") VALUES (%s, %s)
                ON CONFLICT DO NOTHING;
            """, (idea_id, tag_id))
            
        # Process Fragile Dependencies (Phantom Tool Extractor)
        fragile_deps = parsed_data.get('fragileDependencies') or []
        for dep in fragile_deps:
            dep_name = str(dep).lower().strip()
            if not dep_name: continue
            
            cur.execute("""
                INSERT INTO "FragileDependency" (id, name, ecosystem, "complaintCount", "lastReportedAt")
                VALUES (%s, %s, 'unknown', 1, NOW())
                ON CONFLICT (name) DO UPDATE SET 
                  "complaintCount" = "FragileDependency"."complaintCount" + 1,
                  "lastReportedAt" = NOW();
            """, (f"fd_{uuid.uuid4().hex[:22]}", dep_name))

        conn.commit()
        print(f"✅ Inserted to DB: {parsed_data.get('title')}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ DB Error inserting {parsed_data.get('title', 'Unknown')}: {e}")
    finally:
        cur.close()
    return True

def get_existing_urls(conn):
    """Fetches all existing source URLs from the database to prevent duplicate LLM processing."""
    cur = conn.cursor()
    try:
        cur.execute('SELECT "sourceUrl" FROM "Idea" WHERE "sourceUrl" IS NOT NULL')
        urls = {row[0] for row in cur.fetchall()}
        conn.commit() # Clear the read transaction
        return urls
    except Exception as e:
        conn.rollback()
        print(f"Failed to fetch existing URLs: {e}")
        return set()
    finally:
        cur.close()

def run_pipeline():
    if not GEMINI_API_KEY:
        print("FATAL: GEMINI_API_KEY is not configured.")
        return

    # Initialize a SINGLE database connection for the entire batch
    try:
        conn = psycopg2.connect(DB_URL)
    except Exception as e:
        print(f"FATAL: Database connection failed: {e}")
        return

    try:
        # 1. Extract data across all Tiers using our new orchestration function
        scraped_items = get_all_scraped_data(GITHUB_TOKEN)
        
        if not scraped_items:
            print("No issues fetched. Check network or tokens.")
            return

        # 2. Pre-LLM Deduplication: Check against database
        existing_urls = get_existing_urls(conn)
        new_items = [item for item in scraped_items if item.get('url') and item.get('url') not in existing_urls]
        
        print(f"\nScraped {len(scraped_items)} total items. Filtered out {len(scraped_items) - len(new_items)} existing duplicates.")
        if not new_items:
            print("No new unique items to process. Exiting.")
            return
            
        print(f"Processing {len(new_items)} NEW items through Gemini LLM...")
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # 3. Parse and Insert
        for item in new_items:
            if not item.get('bodyText'): continue
            
            print(f"Parsing: {item.get('title')}")
            time.sleep(1.5) # Prevent Gemini API Rate Limiting (HTTP 429)
            try:
                parsed_json = parse_with_gemini(item)
                
                # Gemini returns empty JSON {} if the data was noise
                if parsed_json and "title" in parsed_json:
                    # Generate Embedding for Semantic Search
                    text_to_embed = f"{parsed_json.get('title', '')}. {parsed_json.get('description', '')}"
                    embedding_result = None
                    try:
                         resp = client.models.embed_content(
                             model='gemini-embedding-001',
                             contents=text_to_embed,
                         )
                         embedding_result = resp.embeddings[0].values
                    except Exception as emb_e:
                         print(f"Embedding failed: {emb_e}")
                    
                    oldest, newest = get_historical_dates(parsed_json.get('title', ''))
                    insert_into_db(parsed_json, item.get('url'), conn, embedding_result, oldest, newest)
                else:
                    print(f"Skipped: LLM deemed '{item.get('title')}' as noise.")
                    
            except Exception as e:
                print(f"Failed to process '{item.get('title')}': {e}")
    finally:
        if conn:
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    run_pipeline()
