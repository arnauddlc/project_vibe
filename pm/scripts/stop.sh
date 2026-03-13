#!/usr/bin/env bash
set -e

CONTAINER_NAME="pm-app"

docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
docker rm "${CONTAINER_NAME}" >/dev/null 2>&1 || true

echo "Server stopped."
