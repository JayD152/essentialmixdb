#!/bin/sh
set -e

echo "[entrypoint] Starting Essential Mix DB"

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] WARNING: DATABASE_URL not set. Falling back to local SQLite file dev.db" >&2
  export DATABASE_URL="file:./dev.db"
fi

# Run migrations if using a migrate-capable provider (ignored for plain SQLite file if unchanged)
if echo "$DATABASE_URL" | grep -qiE 'postgres|mysql|sqlserver'; then
  echo "[entrypoint] Database is server-based; running prisma migrate deploy with retries"

  PRISMA_CLI=""
  if [ -x ./node_modules/.bin/prisma ]; then
    PRISMA_CLI=./node_modules/.bin/prisma
  elif command -v npx >/dev/null 2>&1; then
    PRISMA_CLI="npx prisma"
  fi

  if [ -z "$PRISMA_CLI" ]; then
    echo "[entrypoint] ERROR: Prisma CLI not found. Cannot run migrations." >&2
    exit 1
  fi

  ATTEMPTS=0
  MAX_ATTEMPTS=10
  until $PRISMA_CLI migrate deploy; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
      echo "[entrypoint] ERROR: prisma migrate deploy failed after $ATTEMPTS attempts. Exiting." >&2
      exit 1
    fi
    echo "[entrypoint] Migrate failed (attempt $ATTEMPTS). Retrying in 5s..."
    sleep 5
  done
  echo "[entrypoint] Migrations applied successfully."
else
  # Ensure client is generated (needed if mounted volume overrides node_modules or prisma output)
  if [ -x ./node_modules/.bin/prisma ]; then
    ./node_modules/.bin/prisma generate >/dev/null 2>&1 || true
  elif command -v npx >/dev/null 2>&1; then
    npx prisma generate >/dev/null 2>&1 || true
  fi
fi

echo "[entrypoint] Launching app..."
exec "$@"
