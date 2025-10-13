#!/bin/sh
set -e

echo "[entrypoint] Starting Essential Mix DB"

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] WARNING: DATABASE_URL not set. Falling back to local SQLite file dev.db" >&2
  export DATABASE_URL="file:./dev.db"
fi

# Run migrations if using a migrate-capable provider (ignored for plain SQLite file if unchanged)
if echo "$DATABASE_URL" | grep -qiE 'postgres|mysql|sqlserver'; then
  echo "[entrypoint] Running prisma migrate deploy"
  npx prisma migrate deploy
else
  # Ensure client is generated (needed if mounted volume overrides node_modules or prisma output)
  npx prisma generate >/dev/null 2>&1 || true
fi

echo "[entrypoint] Launching app..."
exec "$@"
