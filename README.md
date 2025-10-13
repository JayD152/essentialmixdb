# Essential Mix DB

An Apple Music–inspired web app to browse, search, recommend, and collect every BBC Radio 1 Essential Mix.

> Educational / demo project. Not affiliated with BBC / Radio 1. Replace placeholder data + artwork with your own licensed assets.

## Features
- Browse all mixes (number, artist, title, release date, bio, artwork placeholder)
- Search by artist name or mix number
- Latest & Recommended sections on the homepage
- Mix detail page with bio (editable via API route for now)
- User library (save mixes) via lightweight credentials auth
- Dark translucent UI with Tailwind
- Prisma + SQLite for fast local dev

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM (SQLite dev)
- NextAuth Credentials provider (simple username only)

## Getting Started (Windows PowerShell)

1. Copy env file:
```powershell
Copy-Item .env.example .env
```
2. (Optional) Generate a secret:
```powershell
# Simple random secret
[guid]::NewGuid().ToString("N") | Out-File -Encoding ascii -FilePath secret.txt
```
Update `NEXTAUTH_SECRET` in `.env`.

3. Install dependencies:
```powershell
npm install
```

4. Push database schema & seed:
```powershell
npx prisma db push
npm run seed
```

5. Start dev server:
```powershell
npm run dev
```
Visit http://localhost:3000

## Auth (Demo)
Use any username to sign in (no password). A user record is created if it doesn’t exist.

## Project Structure (key paths)
- `app/` – App Router pages & API route handlers
- `components/` – UI components
- `lib/` – Prisma & auth config
- `prisma/schema.prisma` – Database schema
- `prisma/seed.ts` – Seed script

## Extending
- Add real artwork: store URLs in `artworkUrl`
- Add real audio streaming integration
- Add bio editing UI gated by role
- Migrate to Postgres in production

## Production Deployment & Docker

### Environment Variables
Required (example values):

| Name | Description |
|------|-------------|
| NEXTAUTH_SECRET | Random 32+ char secret (GUID ok) |
| NEXTAUTH_URL | Public base URL (e.g. https://example.com) |
| DATABASE_URL | Prisma connection string (SQLite file or Postgres) |

SQLite (development / single-container only):
```
DATABASE_URL="file:./dev.db"
```

Postgres example:
```
DATABASE_URL="postgresql://user:password@host:5432/essentialmixdb?schema=public"
```

### Docker (Simple SQLite)
Build & run (not for scaling / multi-replica):
```powershell
docker build -t essential-mix-db .
docker run --rm -p 3000:3000 -e NEXTAUTH_SECRET=devsecret -e NEXTAUTH_URL=http://localhost:3000 essential-mix-db
```

Data won’t persist between image rebuilds unless you mount a volume for the SQLite file:
```powershell
docker run --rm -p 3000:3000 `
	-v ${PWD}/prisma/dev.db:/app/prisma/dev.db `
	-e DATABASE_URL="file:./prisma/dev.db" `
	-e NEXTAUTH_SECRET=devsecret `
	-e NEXTAUTH_URL=http://localhost:3000 essential-mix-db
```

Alternative (recommended) with a named volume and dedicated data dir:
```powershell
# Uses docker-compose.sqlite.yml (persists DB at /data/dev.db in a named volume)
docker compose -f docker-compose.sqlite.yml up --build -d
```
In this setup, the app uses `DATABASE_URL=file:/data/dev.db` and mounts a durable named volume at `/data`.

Portainer notes:
- Create a new Stack and paste `docker-compose.sqlite.yml` contents.
- Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in the stack environment.
- The `sqlite_data` named volume is created automatically and persists the DB between deploys.

### Docker + Postgres (Recommended)
Use the included `docker-compose.yml`:
```powershell
docker compose up --build
```
This will:
1. Start Postgres 16
2. Build the Next.js image
3. Run migrations (migrate deploy if Postgres)
4. Expose app on http://localhost:3000

To create the initial migration snapshot when moving from SQLite -> Postgres:
```powershell
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/essentialmixdb?schema=public
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > baseline.sql
# (Optional) apply manually or generate formal migration with 'prisma migrate dev'
```

### Production Hardening Checklist
- Switch to Postgres (or other server DB)
- Ensure strong `NEXTAUTH_SECRET`
- Set `NEXTAUTH_URL` to your public domain
- Add HTTPS termination (reverse proxy or platform TLS)
- Run `npm prune --omit=dev` if not using the provided multi-stage Dockerfile
- Add logging aggregation (stdout collector)
- Add metrics / health endpoint (optional)
- Back up the database (daily automated backups)
- Consider rate limiting review & auth endpoints

### Image Internals
The multi-stage Dockerfile produces a minimal final layer using Next.js standalone output. On container start:
- If `DATABASE_URL` targets Postgres/MySQL/SQLServer → runs `prisma migrate deploy`
- Otherwise (SQLite) → ensures client generation silently

### Scaling Notes
SQLite is file-based; only use it for single-container dev or hobby deployments. For horizontal scaling (multiple replicas), use Postgres and (optionally) a connection pooler like PgBouncer.

## License
MIT (Add a LICENSE file if needed.)
