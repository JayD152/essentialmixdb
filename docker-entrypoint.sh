#!/bin/sh
echo "[entrypoint] Deprecated: docker-entrypoint.sh is no longer used. Prisma CLI has been removed."
echo "[entrypoint] Start the app directly (e.g., node server.js) and use npm run seed for data seeding."
exec "$@"
