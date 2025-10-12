#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/server"

# Load env from project root if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
  echo "[WARN] .env not found at project root. If needed, env defaults will be used on macOS only."
fi

# On macOS, if no MONGODB_URI is provided, try to ensure a local MongoDB is running and exposed on 27017
OS_NAME="$(uname || echo unknown)"
if [ "${OS_NAME}" = "Darwin" ]; then
  if [ -z "${MONGODB_URI:-}" ]; then
    echo "[INFO] macOS detected and MONGODB_URI is not set. Ensuring local MongoDB on localhost:27017..."

    # Helper: check if local port 27017 is reachable
    mongo_port_open() {
      if command -v nc >/dev/null 2>&1; then
        nc -z 127.0.0.1 27017 >/dev/null 2>&1
      else
        # Fallback: try bash /dev/tcp if available
        (echo > /dev/tcp/127.0.0.1/27017) >/dev/null 2>&1 || return 1
      fi
    }

    if mongo_port_open; then
      echo "[INFO] MongoDB already reachable on localhost:27017. Skipping auto-start."
      started="detected"
    else
      started=""
      if command -v docker >/dev/null 2>&1; then
        if docker info >/dev/null 2>&1; then
          # Ensure a Docker container named 'boda-mongo' is running and publishing 27017
          if docker ps -a --format '{{.Names}}' | grep -q '^boda-mongo$'; then
            # Check if container publishes 27017 to host
            HOST_PORT="$(docker inspect -f '{{range $p, $cfg := .NetworkSettings.Ports}}{{if eq $p "27017/tcp"}}{{(index $cfg 0).HostPort}}{{end}}{{end}}' boda-mongo 2>/dev/null || true)"
            if [ -z "${HOST_PORT}" ]; then
              echo "[WARN] Existing 'boda-mongo' container does not expose port 27017. Recreating with port mapping..."
              docker rm -f boda-mongo >/dev/null 2>&1 || true
              docker run -d \
                --name boda-mongo \
                --restart unless-stopped \
                -p 27017:27017 \
                -v boda-mongo-data:/data/db \
                mongo:7 >/dev/null 2>&1 && started="docker"
            else
              echo "[INFO] 'boda-mongo' container exposes port ${HOST_PORT}. Ensuring it's running..."
              docker start boda-mongo >/dev/null 2>&1 && started="docker"
            fi
          else
            echo "[INFO] Creating and starting 'boda-mongo' via Docker with port 27017 published..."
            docker run -d \
              --name boda-mongo \
              --restart unless-stopped \
              -p 27017:27017 \
              -v boda-mongo-data:/data/db \
              mongo:7 >/dev/null 2>&1 && started="docker"
          fi
        else
          echo "[WARN] Docker CLI found but daemon is not running. Skipping Docker startup."
        fi
      fi

      if [ -z "$started" ] && command -v brew >/dev/null 2>&1; then
        echo "[INFO] Starting MongoDB via Homebrew services (mongodb-community) if available..."
        brew services start mongodb-community >/dev/null 2>&1 && started="brew"
      fi

      if [ -z "$started" ]; then
        echo "[WARN] Could not auto-start MongoDB. Please start it manually or set MONGODB_URI in .env."
      fi
    fi

    # Set development-friendly defaults for macOS only
    export MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017}"
    export MONGODB_DB="${MONGODB_DB:-boda-web}"
    export JWT_SECRET="${JWT_SECRET:-dev-secret-change-me}"
    export CORS_ORIGIN="${CORS_ORIGIN:-*}"

    # Wait up to ~20s for Mongo to become reachable if we attempted to start it
    for i in $(seq 1 20); do
      if mongo_port_open; then
        echo "[INFO] MongoDB is reachable on localhost:27017."
        break
      fi
      sleep 1
    done
  fi
fi

echo "Installing dependencies..."
# Prefer using npm ci when lockfile is in sync; fallback to npm install
if [ -f package-lock.json ]; then
  npm ci || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

echo "Starting server..."
node server.js


