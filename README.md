<div align="center">
  <img src="./public/logo.png" alt="Developers-Paradise Logo" width="120" style="border-radius: 20px;"/>
  <h1>🌴 Developers-Paradise</h1>
  <p><strong>A Full-Stack AI-Powered Pain Point & Idea Discovery Platform</strong></p>

  <p>
    <a href="https://github.com/Teraxyl14/Developers-Paradise/commits/main">
      <img src="https://img.shields.io/github/last-commit/Teraxyl14/Developers-Paradise?style=flat-square&color=blue" alt="Last Commit" />
    </a>
    <a href="#license">
       <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License">
    </a>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/AI-Gemini_2.5_Pro-orange?style=flat-square&logo=google" alt="Gemini 2.5 Pro" />
  </p>
</div>

---

Developers-Paradise is designed to autonomously hunt down developer complaints, software limitations, and genuine product ideas across the internet. It analyzes them using state-of-the-art LLMs (Gemini 2.5 Pro) and presents them in a highly-interactive Next.js dashboard. It bridges the gap between developers experiencing friction and builders looking for validated SaaS or open-source ideas.

<br/>

## 🏗 System Architecture Diagram

The system operates via two highly decoupled engines working synchronously via a shared Postgres database:

```mermaid
graph TD;
    %% Data Sources
    subgraph web_sources [Web Data Sources]
        GH[GitHub Issues]
        SE[StackExchange]
        HN[Hacker News]
        RD[Reddit]
        LB[Lobste.rs]
        NX[Next.js Blogs]
        DC[Discourse]
    end

    %% Python Pipeline
    subgraph ingestion [Autonomous Python Ingestion Pipeline]
        SC[Scrapers.py]
        PL[Pipeline Orchestrator]
        AI[Gemini 2.5 Pro: Structuring & Embeedings]
    end

    %% Database
    subgraph DB [Central Database]
        PG[(PostgreSQL + pgvector)]
    end

    %% Next.js Web App
    subgraph NextJS [Next.js Web Dashboard]
        API[API Routes & Server Actions]
        UI[Framer Motion & Tailwind UI]
        Auth[NextAuth.js]
    end

    %% Flow
    web_sources --> SC
    SC --> PL
    PL -->|Raw Text| AI
    AI -->|Structured JSON + Vector Arrays| DB
    
    DB <-->|Prisma ORM| API
    API <--> UI
    Auth <--> DB
```

<br/>

## 💡 Key Features
- **Idea Dashboard**: View dynamic feeds of AI-curated and user-submitted ideas.
- **Trending & Leaderboards**: See which pain points are resonating most with the community by tracking Upvotes and Waitlist sign-ups.
- **Deep Dives**: Individual `idea/[id]` pages featuring difficulty tags, estimated dev times, recommended tech stacks, and source links.
- **Community Interaction**: Save ideas to your profile, join waitlists, comment, and declare you're building them with a linked GitHub Repository.
- **Multi-Source Autonomous Scraping**: Automatically scheduled via GitHub Actions (`cron`) to scrape StackOverflow, GitHub, Reddit, HackerNews, and more.

<br/>

## 🛠 Tech Stack

### Frontend & API (Web Platform)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion (for fluid animations)
- **Data Visualization**: Recharts
- **Authentication**: NextAuth.js (v5 / Auth.js) with Credential/OAuth fallback.
- **Database ORM**: Prisma (v6)

### Data & Backend
- **Database**: PostgreSQL with `pgvector` extension (for semantic search).
- **Autonomous Pipeline**: Python 3.11+
- **AI Processing**: Google Gemini 2.5 Pro (via `google-genai` SDK)
- **Email**: Resend

<br/>

## 📂 Directory Map

```text
Developers-Paradise/
├── ingestion/                 # 🐍 Python Pipeline Engine
│   ├── pipeline.py            # Main data processing orchestrator
│   ├── scrapers.py            # Extraction logic for GitHub, HN, Reddit, etc.
│   └── requirements.txt
├── prisma/                    # 🗄️ Database
│   └── schema.prisma          # DB schemas (Idea, User, Comment, Upvote, etc.)
├── src/                       # 🌐 Next.js Platform
│   ├── actions/               # Server Actions (Mutations & DB ops)
│   ├── app/                   # App Router pages (admin, dashboard, trends, etc.)
│   ├── components/            # Reusable UI components (IdeaCard, ThemeToggle)
│   ├── lib/                   # Utility functions & Prisma client instantiation
│   └── auth.ts                # NextAuth configuration
├── .github/workflows/         # 🤖 GitHub Actions CI/CD (Pipeline Cron)
└── public/                    # Static assets & Branding
```

<br/>

## ⚙️ Local Setup Guide

To run Developers-Paradise locally, you need Node.js, Python 3.11+, and a PostgreSQL server (with pgvector installed).

### 1. Clone the Repository
```bash
git clone https://github.com/Teraxyl14/Developers-Paradise.git
cd Developers-Paradise
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (or create one):
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/problemsite"

# Authentication
AUTH_SECRET="your-nextauth-secret-key"

# AI & Scraping
GEMINI_API_KEY="your-gemini-api-key"
GITHUB_GRAPHQL_TOKEN="your-github-pat"

# External Services
RESEND_API_KEY="your-resend-api-key"
```

### 3. Initialize the Database
Ensure your Postgres database is running and has the `vector` extension enabled.
```bash
npm install
npx prisma generate
npx prisma db push
```

### 4. Run the Web Dashboard
```bash
npm run dev
```
Access the dashboard at [http://localhost:3000](http://localhost:3000).

### 5. Manually Run the Python Pipeline (Optional)
If you want to manually test the AI web-scraper locally without waiting for the GitHub Action cron:
```bash
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows

pip install -r ingestion/requirements.txt
python ingestion/pipeline.py
```

<br/>

## 🤝 Contributing
Want to add a new scraper source (e.g., Discord or X/Twitter)? 
1. Open `ingestion/scrapers.py`.
2. Inherit the `Scraper` base class and build your data extractor.
3. Append it to the `get_all_scraped_data()` function. 
4. The rest is completely handled by pipeline orchestrator and Gemini!

## 📜 License
This project is open-source and available under the terms of the MIT License.
