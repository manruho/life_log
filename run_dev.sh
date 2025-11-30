#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/lifelog_backend"
FRONTEND_DIR="$ROOT/lifelog_frontend"

BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

echo "Starting backend (port ${BACKEND_PORT})..."
if [ -d "$ROOT/venv" ]; then
  # shellcheck disable=SC1091
  source "$ROOT/venv/bin/activate"
fi
(cd "$BACKEND_DIR" && PORT="$BACKEND_PORT" FLASK_DEBUG=true python app.py) &

echo "Starting frontend (port ${FRONTEND_PORT})..."
(cd "$FRONTEND_DIR" && VITE_API_BASE_URL="http://localhost:${BACKEND_PORT}" npm run dev -- --host --port "$FRONTEND_PORT") &

wait
