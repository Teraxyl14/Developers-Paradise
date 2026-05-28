# Developers-Paradise Cloud-Side Edge Extraction Layer

This package runs autonomously on a cloud VPS to extract market signals and developer complaints, pushing raw payloads into a Redis queue. It uses Temporal for orchestration and a Playwright/curl_cffi evasion matrix to bypass Cloudflare and DataDome.

## Local Development

1. **Install dependencies:**
   `pip install -e .`

2. **Install Playwright browsers:**
   `playwright install chromium`

3. **Start Temporal Server (Docker):**
   `temporal server start-dev`

4. **Start Redis:**
   `docker run -p 6379:6379 -d redis`

5. **Run the Worker:**
   `python -m ingestion.edge.worker`

6. **Trigger the Scheduler:**
   `python -m ingestion.edge.run`

## Environment Variables

Copy `.env.example` to `.env` and fill in the required variables (Redis URL, Temporal Host, Proxy credentials).

## Architecture
- **Icebreaker (Stage 1):** Uses Playwright + `playwright-stealth` to solve challenges and extract clearance cookies.
- **Extractor (Stage 2):** Uses `curl_cffi` to mimic Chrome 120 TLS fingerprints and perform high-speed paginated extractions.
- **Queue:** Pushes payloads to Redis (`dp:raw_payloads`) for the local hardware cluster to pick up and process with LLMs.
