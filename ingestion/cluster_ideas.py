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

def run_clustering():
    print("Connecting to database...")
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
            print("Not enough data to cluster. Skipping.")
            return

        print(f"Loaded {len(rows)} embeddings. Starting K-Means Clustering...")
        
        idea_ids = []
        titles = []
        embeddings = []
        
        for row in rows:
            idea_ids.append(row[0])
            titles.append(row[1])
            # Parse the string representation of the vector back into a python list of floats
            vec_str = row[2].strip('[]')
            embeddings.append([float(x) for x in vec_str.split(',')])

        X = np.array(embeddings)
        
        # 2. Run K-Means
        # Dynamically calculate K based on dataset size (e.g., roughly 10 items per cluster)
        num_clusters = max(2, min(len(rows) // 3, 8)) 
        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init='auto')
        labels = kmeans.fit_predict(X)
        
        # 3. Dimensionality Reduction (PCA to 2D for UI rendering)
        pca = PCA(n_components=2)
        X_2d = pca.fit_transform(X)
        
        # 4. Group ideas by cluster to generate summaries and find centroids
        cluster_groups = {}
        for i in range(len(labels)):
            c_id = labels[i]
            if c_id not in cluster_groups:
                cluster_groups[c_id] = {'ids': [], 'titles': [], 'points_2d': []}
            cluster_groups[c_id]['ids'].append(idea_ids[i])
            cluster_groups[c_id]['titles'].append(titles[i])
            cluster_groups[c_id]['points_2d'].append(X_2d[i])
            
        print("Clearing old clusters...")
        # Clear existing clusters (Cascade will set idea.clusterId to null)
        cur.execute('DELETE FROM "Cluster"')
        
        # 5. Process each cluster and save to DB
        print(f"Generating AI Summaries and saving {num_clusters} Clusters...")
        for c_id, data in cluster_groups.items():
            # Calculate the centroid (average x, y) of the cluster for the bubble chart
            points = np.array(data['points_2d'])
            centroid_x = float(np.mean(points[:, 0]))
            centroid_y = float(np.mean(points[:, 1]))
            size = len(data['ids'])
            
            # Generate AI Summary
            summary = generate_cluster_summary(data['titles'])
            print(f"  -> Cluster {c_id}: '{summary}' (Size: {size})")
            
            # Insert Cluster
            cluster_uuid = f"cl_{uuid.uuid4().hex[:20]}"
            cur.execute("""
                INSERT INTO "Cluster" (id, summary, size, x, y, "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id;
            """, (cluster_uuid, summary, size, centroid_x, centroid_y))
            
            # Update Ideas with their new Cluster ID
            for idea_id in data['ids']:
                cur.execute('UPDATE "Idea" SET "clusterId" = %s WHERE id = %s', (cluster_uuid, idea_id))
                
        conn.commit()
        print("✅ Clustering Complete! The Market Galaxy is ready.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Clustering Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_clustering()
