#!/bin/sh
set -e

echo "[entrypoint] Starting Essential Mix DB"

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] WARNING: DATABASE_URL not set. Falling back to local SQLite file dev.db" >&2
  export DATABASE_URL="file:./dev.db"
fi

# Run migrations if using a migrate-capable provider (ignored for plain SQLite file if unchanged)
if echo "$DATABASE_URL" | grep -qiE 'postgres|mysql|sqlserver'; then
  echo "[entrypoint] Server DB detected; running migrations"
  SCHEMA_PATH="./prisma/schema.prisma"
  # helper to run prisma command (local or npx)
  run_prisma() {
    if [ -x ./node_modules/.bin/prisma ]; then
      ./node_modules/.bin/prisma "$@"
    elif command -v npx >/dev/null 2>&1; then
      npx prisma "$@"
    else
      return 127
    fi
  }

  # wait for DB to accept connections (retry up to ~60s)
  tries=0
  until run_prisma migrate status --schema "$SCHEMA_PATH" >/dev/null 2>&1; do
    tries=$((tries+1))
    if [ $tries -ge 30 ]; then
      echo "[entrypoint] Database not ready after waiting; proceeding anyway"
      break
    fi
    echo "[entrypoint] Waiting for database... ($tries)"
    sleep 2
  done

  # attempt migrate deploy, fallback to db push for brand-new DBs
  if ! run_prisma migrate deploy --schema "$SCHEMA_PATH"; then
    echo "[entrypoint] migrate deploy failed; attempting prisma db push for fresh DB"
    run_prisma db push --accept-data-loss --schema "$SCHEMA_PATH" || echo "[entrypoint] prisma db push also failed"
  fi
else
  # Ensure client is generated (needed if mounted volume overrides node_modules or prisma output)
  if [ -x ./node_modules/.bin/prisma ]; then
    ./node_modules/.bin/prisma generate >/dev/null 2>&1 || true
  else
    command -v npx >/dev/null 2>&1 && npx prisma generate >/dev/null 2>&1 || true
  fi
fi

echo "[entrypoint] Launching app..."
exec "$@"
