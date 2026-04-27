"""
Cluster Ideas V2 — K-Means clustering with composite PMF (Product-Market Fit) scoring.

PMF Score Formula:
  PMF = (cluster_size_norm * 0.4) + (avg_upvotes_norm * 0.3) + (avg_mentions_norm * 0.2) + (recency_norm * 0.1)

Each component is normalized to 0-100 range before weighting.
"""
import os
import json
import psycopg2
import uuid
import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from dotenv import load_dotenv
from google import genai
from google.genai import types
from datetime import datetime, timezone

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DB_URL = os.getenv("DATABASE_URL")

def generate_cluster_summary(titles):
    """Uses Gemini to summarize a list of grouped idea titles into a 3-5 word label."""
    if not GEMINI_API_KEY: return "Uncategorized Cluster"
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    prompt = f"""
    You are an expert product manager. I have clustered together several software developer complaints and feature requests based on their semantic similarity.
    Read the following list of project titles and provide a concise, 3 to 5 word summary label for this cluster (e.g., "Postgres Connection Pooling", "React State Management", "Docker Build Speeds").
    Return ONLY the raw string label, no markdown, no quotes, no conversational filler.
    
    Titles in this cluster:
    {chr(10).join([f"- {t}" for t in titles])}
    """
    try:
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=prompt,
        )
        return response.text.strip().replace('"', '')
    except Exception as e:
        print(f"Failed to generate summary: {e}")
        return "Developer Pain Points"


def normalize_to_100(values):
    """Normalize a list of values to 0-100 range. Returns list of floats."""
    if not values:
        return []
    min_val = min(values)
    max_val = max(values)
    if max_val == min_val:
        return [50.0] * len(values)  # All equal → mid-range
    return [(v - min_val) / (max_val - min_val) * 100 for v in values]


def calculate_pmf_scores(cluster_groups, conn):
    """Calculate composite PMF scores for each cluster.
    
    Components:
      - cluster_size (40%): Larger clusters indicate higher demand density
      - avg_upvotes (30%): Community validation signal
      - avg_mentions (20%): Cross-source validation (anti-echo-chamber metric)
      - recency (10%): Is this still an active pain point?
    """
    cur = conn.cursor()
    
    # Collect raw metrics per cluster
    cluster_metrics = {}
    
    for c_id, data in cluster_groups.items():
        idea_ids = data['ids']
        
        # Get upvote counts and mention counts for ideas in this cluster
        if not idea_ids:
            continue
            
        placeholders = ','.join(['%s'] * len(idea_ids))
        
        cur.execute(f"""
            SELECT 
                i.id,
                i."mentionCount",
                i."lastReportedAt",
                i."createdAt",
                COUNT(u."userId") as upvote_count
            FROM "Idea" i
            LEFT JOIN "Upvote" u ON u."ideaId" = i.id
            WHERE i.id IN ({placeholders})
            GROUP BY i.id, i."mentionCount", i."lastReportedAt", i."createdAt"
        """, tuple(idea_ids))
        
        rows = cur.fetchall()
        
        total_upvotes = 0
        total_mentions = 0
        latest_date = None
        
        for row in rows:
            total_upvotes += row[4]  # upvote_count
            total_mentions += row[1]  # mentionCount
            # Track the most recent activity date
            date = row[2] or row[3]  # lastReportedAt or createdAt
            if date and (latest_date is None or date > latest_date):
                latest_date = date
        
        n = len(idea_ids)
        avg_upvotes = total_upvotes / n if n > 0 else 0
        avg_mentions = total_mentions / n if n > 0 else 0
        
        # Recency: days since last activity (lower is better, so we invert later)
        if latest_date:
            if latest_date.tzinfo is None:
                latest_date = latest_date.replace(tzinfo=timezone.utc)
            days_since = (datetime.now(timezone.utc) - latest_date).days
        else:
            days_since = 365  # Assume old if no date
        
        cluster_metrics[c_id] = {
            'size': n,
            'avg_upvotes': avg_upvotes,
            'avg_mentions': avg_mentions,
            'days_since_activity': days_since,
        }
    
    cur.close()
    
    if not cluster_metrics:
        return {}
    
    # Normalize each component to 0-100 across all clusters
    c_ids = list(cluster_metrics.keys())
    sizes = normalize_to_100([cluster_metrics[c]['size'] for c in c_ids])
    upvotes = normalize_to_100([cluster_metrics[c]['avg_upvotes'] for c in c_ids])
    mentions = normalize_to_100([cluster_metrics[c]['avg_mentions'] for c in c_ids])
    
    # Invert recency (fewer days = higher score)
    raw_recency = [cluster_metrics[c]['days_since_activity'] for c in c_ids]
    max_days = max(raw_recency) if raw_recency else 1
    recency = normalize_to_100([max_days - d for d in raw_recency])
    
    # Weighted composite
    pmf_scores = {}
    for i, c_id in enumerate(c_ids):
        score = (sizes[i] * 0.4) + (upvotes[i] * 0.3) + (mentions[i] * 0.2) + (recency[i] * 0.1)
        pmf_scores[c_id] = round(score, 1)
    
    return pmf_scores


def run_clustering():
    print("=" * 60)
    print("CLUSTERING V2 — K-Means + PMF Scoring")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(DB_URL)
    except Exception as e:
        print(f"FATAL: Database connection failed: {e}")
        return

    cur = conn.cursor()
    
    try:
        # 1. Fetch all ideas with embeddings
        cur.execute('SELECT id, title, embedding::text FROM "Idea" WHERE embedding IS NOT NULL')
        rows = cur.fetchall()
        
        if not rows or len(rows) < 3:
            print("Not enough data to cluster (need ≥ 3 embedded ideas). Skipping.")
            return

        print(f"Loaded {len(rows)} embeddings. Starting K-Means...")
        
        idea_ids = []
        titles = []
        embeddings = []
        
        for row in rows:
            idea_ids.append(row[0])
            titles.append(row[1])
            vec_str = row[2].strip('[]')
            embeddings.append([float(x) for x in vec_str.split(',')])

        X = np.array(embeddings)
        
        # 2. Run K-Means (dynamic K: ~5-8 ideas per cluster, capped)
        num_clusters = max(2, min(len(rows) // 5, 12))
        print(f"Using K={num_clusters} clusters for {len(rows)} ideas.")
        
        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init='auto')
        labels = kmeans.fit_predict(X)
        
        # 3. PCA → 2D for Market Galaxy visualization
        pca = PCA(n_components=2)
        X_2d = pca.fit_transform(X)
        
        # 4. Group ideas by cluster
        cluster_groups = {}
        for i in range(len(labels)):
            c_id = int(labels[i])
            if c_id not in cluster_groups:
                cluster_groups[c_id] = {'ids': [], 'titles': [], 'points_2d': []}
            cluster_groups[c_id]['ids'].append(idea_ids[i])
            cluster_groups[c_id]['titles'].append(titles[i])
            cluster_groups[c_id]['points_2d'].append(X_2d[i])
        
        # 5. Calculate PMF scores
        print("Calculating PMF scores...")
        pmf_scores = calculate_pmf_scores(cluster_groups, conn)
        
        # 6. Clear old clusters
        print("Clearing old clusters...")
        cur.execute('DELETE FROM "Cluster"')
        
        # 7. Save clusters with PMF scores
        print(f"Generating AI summaries and saving {num_clusters} clusters...\n")
        for c_id, data in cluster_groups.items():
            points = np.array(data['points_2d'])
            centroid_x = float(np.mean(points[:, 0]))
            centroid_y = float(np.mean(points[:, 1]))
            size = len(data['ids'])
            pmf = pmf_scores.get(c_id, 50.0)
            
            summary = generate_cluster_summary(data['titles'])
            print(f"  → Cluster {c_id}: '{summary}' (Size: {size}, PMF: {pmf})")
            
            cluster_uuid = f"cl_{uuid.uuid4().hex[:20]}"
            cur.execute("""
                INSERT INTO "Cluster" (id, summary, size, x, y, "pmfScore", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id;
            """, (cluster_uuid, summary, size, centroid_x, centroid_y, pmf))
            
            for idea_id in data['ids']:
                cur.execute('UPDATE "Idea" SET "clusterId" = %s WHERE id = %s', (cluster_uuid, idea_id))
                
        conn.commit()
        
        print(f"\n{'=' * 60}")
        print(f"CLUSTERING V2 COMPLETE")
        print(f"  Clusters:     {num_clusters}")
        print(f"  Ideas mapped: {len(idea_ids)}")
        print(f"  Top PMF:      {max(pmf_scores.values()) if pmf_scores else 'N/A'}")
        print(f"{'=' * 60}")

    except Exception as e:
        conn.rollback()
        print(f"[ERR] Clustering Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_clustering()
