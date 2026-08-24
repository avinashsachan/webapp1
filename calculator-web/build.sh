#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="${IMAGE_NAME:-orbit-calculator}"
CONTAINER_NAME="${CONTAINER_NAME:-orbit-calculator}"
PORT="${PORT:-8080}"
RUNTIME="${CONTAINER_RUNTIME:-podman}"

"$RUNTIME" build -t "$IMAGE_NAME" .
"$RUNTIME" rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
"$RUNTIME" run -d --name "$CONTAINER_NAME" -p "$PORT:80" "$IMAGE_NAME"

printf 'Calculator running at http://localhost:%s\n' "$PORT"
