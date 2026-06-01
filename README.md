<div align="center">
  <img src="./public/logo.png" alt="Developers-Paradise Logo" width="120" style="border-radius: 20px;"/>
  <h1>🌴 Developers-Paradise</h1>
  <p><strong>A Decoupled Cloud-Edge & Local-AI Developer Problem Discovery Platform</strong></p>

  <p>
    <a href="https://github.com/Teraxyl14/Developers-Paradise/commits/main">
      <img src="https://img.shields.io/github/last-commit/Teraxyl14/Developers-Paradise?style=flat-square&color=blue" alt="Last Commit" />
    </a>
    <a href="#license">
       <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License">
    </a>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Python-3.12+-blue?style=flat-square&logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/AI-Gemini_3.5_Flash-orange?style=flat-square&logo=google" alt="Gemini 3.5 Flash" />
    <img src="https://img.shields.io/badge/Orchestration-Temporal-red?style=flat-square&logo=temporal" alt="Temporal" />
    <img src="https://img.shields.io/badge/Queue-Redis-red?style=flat-square&logo=redis" alt="Redis" />
  </p>
</div>

---

Developers-Paradise is an autonomous, end-to-end data mining and "idea factory" pipeline. It continuously monitors target forums, software reviews, and developer communities around the web for real-world code complaints and structural software limitations. 

Instead of building textbook, tutorial-cloned projects, this platform aggregates, structures, and clusters genuine developer pain points into resume-ready, in-demand software project ideas.

---

## 🏗 System Architecture Diagram

The platform is designed around a **highly decoupled two-tier architecture** synchronized via a central PostgreSQL database, ensuring that resource-heavy AI inference is completely separated from high-speed adversarial web scraping.

```mermaid
flowchart TD
    %% Styling Definitions
    classDef cloud fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef broker fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef local fill:#022c22,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef database fill:#1c1917,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef web fill:#0f172a,stroke:#ec4899,stroke-width:2px,color:#fff;

    %% Nodes
    subgraph CloudVPS ["1. Cloud VPS Edge Extractor (Ubuntu / Docker / Temporal)"]
        A[Temporal SchedulerWorkflow] -->|Spawns| B[Extraction child workflow]
        B -->|Stage 1: WAF Bypass| C[Icebreaker Playwright]
        C -->|SessionContext| D[Extractor curl_cffi]
        D -->|Impersonate Client & Scrape| E[(Target Platforms: G2, Discord, Discourse, etc.)]
        E -->|Raw HTML/JSON| D
        D -->|Stage 3: Enqueue| F[Redis Broker]
    end

    subgraph Bridge ["2. Message Queue Bridge (Redis)"]
        F -->|Pipelined RPUSH| G[Cloud Redis Queue dp:raw_payloads]
        G -.->|BLPOP polling| H[Local Queue Poller]
    end

    subgraph LocalWorkstation ["3. Local Hardware AI Processor (NPU / GPU)"]
        H -->|1. LLM Triage & Schema Structuring| I[Gemini API Fallback Chain]
        H -->|2. Vector Embedding| J[Gemini Embedding 001]
        H -->|3. pgvector Cosine similarity search| K[(Neon Postgres Database)]
        
        K -->|Cos Sim > 0.90| L[Merge: Increment mentionCount & append source]
        K -->|New Idea| M[Insert Idea, Tags & FragileDependencies]
    end

    subgraph Analytics ["4. Analytical clustering & PMF Engine"]
        N[cluster_ideas.py] -->|Load embeddings| K
        N -->|K-Means Clustering| O[Group into thematic clusters]
        N -->|PCA| P[Project 3072D to 2D X,Y coordinates]
        N -->|PMF Composite Score| Q[Weighted composite score calculation]
        N -->|Gemini Labeling| R[Update Postgres Database]
        R -->|Sync coordinates & clusters| K
    end

    subgraph WebApp ["5. Next.js Frontend Presentation Layer"]
        S[Prisma ORM Client] -->|Real-time queries| K
        T[Market Galaxy React Plot] -.->|Visualizes coordinates| S
        U[User Telemetry: Upvotes & Comments] -->|Feeds back to| K
    end

    %% Apply Styles
    class CloudVPS,A,B,C,D,E,F cloud;
    class Bridge,G broker;
    class LocalWorkstation,H,I,J,L,M local;
    class Database,K database;
    class WebApp,S,T,U,Analytics,N,O,P,Q,R web;
```

### 1. Cloud VPS Edge Extractor (Scraping & Evasion)
*   **Orchestration:** Run continuously by a systemd daemon executing a [Temporal Worker](file:///m:/Projects/ProblemSite/ingestion/edge/worker.py). Employs the durable **Entity Workflow** pattern to schedule extraction intervals.
*   **WAF Evasion (Icebreaker):** Uses stealth-patched headless Playwright Chromium to bypass DataDome and Cloudflare challenge walls. Extracted session context is passed to a high-speed `curl_cffi` HTTP client using JA3/JA4 TLS and HTTP/2 client impersonation to pull pages without blocks.
*   **Proxy Health:** Automatically routes through sticky residential proxies, quarantining burned IPs and maintaining subnet diversity.

### 2. Message Broker (Redis Queue)
*   Raw payloads are enriched with queue metadata and pushed into the cloud Redis broker (`dp:raw_payloads`). 
*   Acts as a buffer: if your local processor is offline, payloads queue up in Redis with zero loss. If ingestion crashes consistently, items are moved to the Dead-Letter Queue (`dp:raw_payloads:dlq`).

### 3. Local Workstation AI Processor (LLM Ingestion)
*   Runs locally on your high-performance hardware (RTX 5080 / Intel NPU), polling Redis via `BLPOP`.
*   **Fallback Model Chain:** Structures raw venting into resume-ready JSON using an active circuit-breaker routing model calls to `gemini-3.5-flash` -> `gemma-4-31b` -> `gemini-3-flash` on rate-limit exhaustion.
*   **Semantic Deduplication (The USP):** Generates 3072D embeddings and runs `pgvector` similarity queries. If a similar issue is found (`similarity > 0.90`), it merges them to increment a global `mentionCount` and append the source community. **Duplicates become indicators of global demand!**

### 4. Analytical Clustering & PMF Engine
*   Executes dynamically. Runs K-Means clustering and PCA to project 3072D embeddings down to a 2D space for the frontend scatterplot.
*   Calculates composite **Product-Market Fit (PMF)** scores based on:
    $$PMF = (Size_{norm} \times 0.4) + (Upvotes_{norm} \times 0.3) + (Mentions_{norm} \times 0.2) + (Recency_{norm} \times 0.1)$$

---

## 💡 Key Features

*   **Premium Web Experience:** Modern UI/UX built with Tailwind CSS v4, Framer Motion transitions, and customized glassmorphism styling.
*   **Interactive Market Galaxy:** A 2D scatter-mapped canvas displaying thematic clusters of software friction. The bubble sizes and colors indicate verified consumer PMF (cool blue → hot red).
*   **AI Architecture Roasts:** Link your actual GitHub repository implementation to a project card. The platform audits the code, tech stack, and structure to generate a customized, gamified AI architecture roast.
*   **Secure Auth.js Sign-In:** Complete integration of NextAuth.js supporting GitHub/Google OAuth and secure Credentials with bcrypt encryption, styled in a sleek modal card.
*   **Gamified Leaderboard:**Animated top podium ranking users based on streaks, upvotes, and successfully claims of real-world project builds.
*   **Continuous CI/CD Delivery:** Automatic `.vercelignore` to bypass python pipeline builds on Vercel, paired with a GitHub Actions SSH script (`deploy-edge-extractor.yml`) that automatically tests and restarts systemd services on your VPS when pushing updates.

---

## 🛠 Tech Stack

*   **Frontend Framework:** Next.js 16 (App Router)
*   **Styling:** Tailwind CSS v4, Framer Motion
*   **Database & ORM:** PostgreSQL + `pgvector` (via Prisma Client v6)
*   **Durable Engine:** Python 3.12+ & Temporal SDK
*   **Primary AI Model Stack:** Gemini 3.5 Flash, Gemma 4 31B, Gemini 3 Flash
*   **Task Queue Broker:** Redis 7

---

## 📂 Directory Map

```text
Developers-Paradise/
├── ingestion/                 # 🐍 Python Ingestion Engine
│   ├── edge/                  # ☁️ Cloud VPS Scraper Layer (Temporal Worker)
│   │   ├── activities/        # Playwright Cookie harvesting & Queue activities
│   │   ├── broker/            # Redis broker interface
│   │   ├── config/            # Settings and scraping target configuration
│   │   ├── evasion/           # Icebreaker Playwright & curl_cffi protocol evasion
│   │   ├── targets/           # 10+ platform scrapers (G2, Discord, Discourse, etc.)
│   │   ├── workflows/         # Scheduler & Extraction Temporal workflows
│   │   ├── run.py             # Script to bootstrap scheduler workflow
│   │   └── worker.py          # Temporal Worker listening on task queue
│   ├── local_processor.py     # 🖥️ Workstation Queue poller & Gemini/Gemma processing
│   ├── cluster_ideas.py       # 📊 Dynamic K-Means clustering & PCA calculation
│   └── local-requirements.txt # Workstation requirements
├── prisma/                    # 🗄️ Database
│   └── schema.prisma          # DB schemas (Idea, Cluster, FragileDependency, etc.)
├── src/                       # 🌐 Next.js Platform
│   ├── actions/               # Server Actions (Mutations & DB ops)
│   ├── app/                   # App Router pages (admin, dashboard, trends, etc.)
│   ├── components/            # Reusable UI components
│   └── lib/                   # Utility functions & Prisma client
├── .github/workflows/         # 🤖 GitHub Actions CI/CD (VPS automatic deployer)
└── .vercelignore              # Instructs Vercel to bypass Python pipeline
```

---

## ⚙️ Local Setup Guide

To run the full stack locally:

### 1. Clone & Install Web Dependencies
```bash
git clone https://github.com/Teraxyl14/Developers-Paradise.git
cd Developers-Paradise
npm install
```

### 2. Configure Local environment
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://neondb_owner:password@neon-pooler-url/neondb?sslmode=require"

# NextAuth Configuration
AUTH_SECRET="random-secure-secret"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# Data Pipeline (Gemini/Redis)
REDIS_URL="redis://:password@your-vps-ip:6379/0"
GEMINI_API_KEY="your-google-ai-studio-api-key"
GH_GRAPHQL_TOKEN="your-github-pat"

# External Services
RESEND_API_KEY="your-resend-api-key"
```

### 3. Sync Database schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Start Next.js Development Server
```bash
npm run dev
```
The website is now accessible on [http://localhost:3000](http://localhost:3000).

### 5. Start Ingestion & Analytical Engines (Second terminal)
Install workstation requirements and launch:
```bash
# Install local python packages
pip install -r ingestion/local-requirements.txt

# Start the continuous Queue poller
python ingestion/local_processor.py

# Periodically trigger the clustering calculation
python ingestion/cluster_ideas.py
```

---

## 📜 License
This project is open-source and available under the terms of the [MIT License](LICENSE).
