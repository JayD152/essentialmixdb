#!/bin/sh
set -e

echo "[entrypoint] Starting Essential Mix DB"

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] WARNING: DATABASE_URL not set. Falling back to local SQLite file prisma/dev.db" >&2
  export DATABASE_URL="file:./prisma/dev.db"
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

  # Optional seed on empty database
  if [ "${SEED_ON_EMPTY:-1}" = "1" ]; then
    echo "[entrypoint] Checking if database is empty for seeding (server DB)"
    set +e
    COUNT_OUT=$(node -e "try{const {PrismaClient}=require('@prisma/client');(async()=>{const p=new PrismaClient();const c=await p.mix.count();console.log(c);await p.$disconnect();process.exit(0)})()}catch(e){process.exit(2)}")
    STATUS=$?
    set -e
    if [ $STATUS -eq 0 ] && [ "$COUNT_OUT" = "0" ]; then
      echo "[entrypoint] Running seed (prisma/seed.cjs)"
      node prisma/seed.cjs || echo "[entrypoint] Seed script failed"
    fi
  fi
else
  # SQLite: ensure client + schema exist (idempotent)
  # Try to create directory for SQLite file if using file:/absolute/path or file:./relative/path
  DB_URL="$DATABASE_URL"
  case "$DB_URL" in
    file:/*)
      DB_PATH="${DB_URL#file:}"
      ;;
    file:./*)
      DB_PATH="${DB_URL#file:./}"
      ;;
    file:*)
      # fallback: strip prefix
      DB_PATH="${DB_URL#file:}"
      ;;
    *)
      DB_PATH=""
      ;;
  esac
  if [ -n "$DB_PATH" ]; then
    DB_DIR=$(dirname "$DB_PATH")
    mkdir -p "$DB_DIR" || true
  fi

  if [ -x ./node_modules/.bin/prisma ]; then
    echo "[entrypoint] Prisma generate (SQLite)"
    ./node_modules/.bin/prisma generate --schema ./prisma/schema.prisma || echo "[entrypoint] prisma generate failed"
    echo "[entrypoint] Prisma db push (SQLite)"
    if ! ./node_modules/.bin/prisma db push --accept-data-loss --schema ./prisma/schema.prisma; then
      echo "[entrypoint] ERROR: prisma db push failed; schema may not be applied"
    fi
  else
    if command -v npx >/dev/null 2>&1; then
      echo "[entrypoint] Prisma generate via npx (SQLite)"
      npx prisma generate --schema ./prisma/schema.prisma || echo "[entrypoint] prisma generate failed (npx)"
      echo "[entrypoint] Prisma db push via npx (SQLite)"
      if ! npx prisma db push --accept-data-loss --schema ./prisma/schema.prisma; then
        echo "[entrypoint] ERROR: prisma db push failed (npx); schema may not be applied"
      fi
    else
      echo "[entrypoint] WARNING: prisma CLI not available; SQLite schema not ensured"
    fi
  fi

  # Optional seed on empty database (SQLite)
  if [ "${SEED_ON_EMPTY:-1}" = "1" ]; then
    echo "[entrypoint] Checking if database is empty for seeding (SQLite)"
    set +e
    COUNT_OUT=$(node -e "try{const {PrismaClient}=require('@prisma/client');(async()=>{const p=new PrismaClient();const c=await p.mix.count();console.log(c);await p.$disconnect();process.exit(0)})()}catch(e){process.exit(2)}")
    STATUS=$?
    set -e
    if [ $STATUS -eq 0 ] && [ "$COUNT_OUT" = "0" ]; then
      echo "[entrypoint] Running seed (prisma/seed.cjs)"
      node prisma/seed.cjs || echo "[entrypoint] Seed script failed"
    fi
  fi
fi

echo "[entrypoint] Launching app..."
exec "$@"
