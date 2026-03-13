#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

IMAGE_NAME="pm-app"
CONTAINER_NAME="pm-app"
FOREGROUND="${PM_FOREGROUND:-0}"
ENV_FILE="$ROOT_DIR/.env"
ENV_ARGS=()

if [ -f "$ENV_FILE" ]; then
  ENV_ARGS=(--env-file "$ENV_FILE")
else
  echo "Warning: .env not found. OPENROUTER_API_KEY will be unavailable."
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker rm -f "${CONTAINER_NAME}" > /dev/null
fi

docker build -t "${IMAGE_NAME}" .

if [ "$FOREGROUND" = "1" ]; then
  echo "Starting server at http://localhost:8000"
  docker run --rm --name "${CONTAINER_NAME}" -p 8000:8000 "${ENV_ARGS[@]}" "${IMAGE_NAME}"
else
  docker run -d --name "${CONTAINER_NAME}" -p 8000:8000 "${ENV_ARGS[@]}" "${IMAGE_NAME}"
  echo "Server running at http://localhost:8000"
fi
