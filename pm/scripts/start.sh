#!/usr/bin/env bash
set -e

IMAGE_NAME="pm-app"
CONTAINER_NAME="pm-app"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker rm -f "${CONTAINER_NAME}" > /dev/null
fi

docker build -t "${IMAGE_NAME}" .
docker run -d --name "${CONTAINER_NAME}" -p 8000:8000 "${IMAGE_NAME}"

echo "Server running at http://localhost:8000"
