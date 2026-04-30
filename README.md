<div align="center">
  <img src="./public/logo.png" alt="Developers-Paradise Logo" width="120" style="border-radius: 20px;"/>
  <h1>🌴 Developers-Paradise</h1>
  <p><strong>A Full-Stack AI-Powered Developer Problem Discovery Platform</strong></p>

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
    <img src="https://img.shields.io/badge/Version-1.5-purple?style=flat-square" alt="Version 1.5" />
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

### Core Platform
- **Premium UI/UX**: Built with Framer Motion, Tailwind CSS v4, and custom glassmorphism utilities for a dynamic, modern SaaS experience.
- **Idea Dashboard**: View dynamic feeds of AI-curated and user-submitted ideas, ranked by Trending, Latest, or Contrarian demand signals.
- **Market Intelligence & Trends**: Visualize "The Market Galaxy" — a PMF-scored heatmap of AI-clustered developer complaints, color-coded by validated market demand (cool blue → hot red).
- **AI Architecture Roasts**: Link your GitHub repo to an idea and let Gemini 2.5 Pro generate a customized "Roast" analyzing your tech stack, architecture, and deployment strategy.
- **Gamified Leaderboard**: Climb the ranks on an animated top-3 podium based on ideas submitted, upvotes received, and repos linked.
- **Multi-Source Autonomous Scraping**: Automatically scheduled via GitHub Actions (`cron`) to scrape StackOverflow, GitHub, Reddit, HackerNews, and more.

### V1.5 — Quality of Life (Latest)
- **Inline Discuss**: The "Discuss" button now expands the idea card, scrolls to comments, and auto-focuses the input — no page navigation required.
- **Auth-Gated Interactions**: Unauthenticated users can browse freely; clicking Upvote, Save, Waitlist, or Discuss redirects to login.
- **Revamped Filters**: Labeled filter groups (Difficulty + Domain dropdown), live count badges, and a "Clear filters" button for the dashboard feed.
- **Profile Upgrade**: Tabbed interface (Edit / My Ideas / Saved / Projects), activity stats bar, 4 social links (GitHub, Twitter, Website, LinkedIn), and "Member since" date.
- **Distinct Chart Palettes**: Semantic colors for difficulty (green/amber/red), teal for domains, purple gradient for stacks — no more visual confusion.
- **PMF Heatmap Galaxy**: Market Galaxy now includes a legend, info callout, cluster name labels, and a continuous PMF color scale.
- **Admin Access Control**: Styled "Access Denied" page for unauthorized users instead of a silent redirect.
- **Click Feedback**: All interactive buttons now have `active:scale-95` tactile feedback for instant responsiveness.
- **Cleaner Branding**: Navbar shows logo icon only; replaced all overused "pain point" terminology with varied vocabulary.

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
│   │   └── profile/           # Tabbed profile page with stats & social links
│   ├── components/            # Reusable UI components (IdeaCard, CommentSection, DashboardFeed)
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

## 📋 Changelog

### v1.5 — Quality of Life Overhaul
- Inline comment expansion via Discuss button
- Auth-gated interactions (login redirect for unauthenticated users)
- PMF heatmap coloring, legend, and labels for Market Galaxy
- Distinct color palettes per chart type
- Dashboard filter revamp with domain dropdown and count badges
- Profile upgrade: tabbed layout, stats bar, 4 social link fields
- Navbar logo icon only, removed redundant brand text
- Replaced all "pain point" copy with varied terminology
- Admin access restricted to allowlisted emails with styled Access Denied page
- Tactile button feedback (`active:scale-95`) on all interactions
- Increased card spacing to reduce dashboard crowding

### v1.0 — Initial Release
- Full-stack Next.js 16 platform with Prisma + PostgreSQL
- Autonomous Python scraping pipeline (7 sources)
- Gemini 2.5 Pro AI analysis and structuring
- Market Galaxy scatter visualization
- Gamified leaderboard with animated podium
- AI Architecture Roasts for linked repos
- Newsletter system via Resend

<br/>

## 🤝 Contributing
Want to add a new scraper source (e.g., Discord or X/Twitter)? 
1. Open `ingestion/scrapers.py`.
2. Inherit the `Scraper` base class and build your data extractor.
3. Append it to the `get_all_scraped_data()` function. 
4. The rest is completely handled by pipeline orchestrator and Gemini!

## 📜 License
This project is open-source and available under the terms of the MIT License.
