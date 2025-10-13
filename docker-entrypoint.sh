#!/bin/sh
set -e

echo "[entrypoint] Starting Essential Mix DB"

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] WARNING: DATABASE_URL not set. Falling back to local SQLite file dev.db" >&2
  export DATABASE_URL="file:./dev.db"
fi

# Run migrations if using a migrate-capable provider (ignored for plain SQLite file if unchanged)
if echo "$DATABASE_URL" | grep -qiE 'postgres|mysql|sqlserver'; then
  echo "[entrypoint] Database is server-based; attempting prisma migrate deploy"
  if [ -x ./node_modules/.bin/prisma ]; then
    ./node_modules/.bin/prisma migrate deploy || echo "[entrypoint] prisma migrate deploy failed (CLI present)"
  else
    # Try npx if available; do not fail container if not
    if command -v npx >/dev/null 2>&1; then
      npx prisma migrate deploy || echo "[entrypoint] prisma CLI not available via npx; skipping migrations"
    else
      echo "[entrypoint] npx not found; skipping migrations"
    fi
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
