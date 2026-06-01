#!/bin/bash
# ==============================================================================
# VPS Provisioning Script for Developers-Paradise Edge Extractor
# Run this script as root (or with sudo) on your fresh Ubuntu 24.04/22.04 VPS
# ==============================================================================

set -e

echo "🚀 Starting VPS Provisioning for Developers-Paradise..."

# 1. Update and install system dependencies
echo "📦 Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y git python3.12-venv python3.12-dev build-essential curl wget jq

# 2. Install Docker and Docker Compose (if not present)
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# 3. Create deployment directory
echo "📁 Setting up /opt/developers-paradise..."
sudo mkdir -p /opt/developers-paradise
sudo chown -R $USER:$USER /opt/developers-paradise

# 4. Start Redis and Temporal via Docker Compose
echo "⚙️ Starting Redis and Temporal Orchestration Engine..."
cat << 'EOF' > /opt/developers-paradise/docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: dp-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  temporal:
    image: temporalio/auto-setup:latest
    container_name: dp-temporal
    restart: always
    ports:
      - "7233:7233"
      - "8233:8233"
    environment:
      - DB=postgres12
      - DB_PORT=5432
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_SEEDS=postgres
    depends_on:
      - postgres

  postgres:
    image: postgres:14
    container_name: dp-temporal-db
    restart: always
    environment:
      - POSTGRES_USER=temporal
      - POSTGRES_PASSWORD=temporal
    volumes:
      - temporal-db-data:/var/lib/postgresql/data

volumes:
  redis-data:
  temporal-db-data:
EOF

cd /opt/developers-paradise
sudo docker compose up -d

# 5. Setup Systemd Service for the Python Worker
echo "🔧 Configuring Systemd Service for the Python Temporal Worker..."
cat << 'EOF' | sudo tee /etc/systemd/system/dp-edge-extractor.service
[Unit]
Description=Developers-Paradise Edge Extractor (Temporal Worker)
After=network.target docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/developers-paradise/ingestion/edge
Environment="PATH=/opt/developers-paradise/ingestion/edge/.venv/bin:$PATH"
# Note: You will need to create a .env file in /opt/developers-paradise/ingestion/edge/.env
ExecStart=/opt/developers-paradise/ingestion/edge/.venv/bin/python worker.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable dp-edge-extractor.service

echo ""
echo "✅ VPS Provisioning Script Completed!"
echo ""
echo "NEXT STEPS (Once you clone your repo to /opt/developers-paradise):"
echo "1. Configure your environment variables in: /opt/developers-paradise/ingestion/edge/.env"
echo "2. The GitHub Action will automatically handle Python pip installs and Playwright setup."
echo "3. Run 'sudo systemctl start dp-edge-extractor.service' to start the worker."
echo "=============================================================================="
