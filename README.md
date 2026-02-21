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
- Sequelize + SQLite for fast local dev

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Sequelize ORM (SQLite dev)
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

4. Initialize database & seed (SQLite file will be created on first run):
```powershell
npm run seed
```

5. Start dev server:
```powershell
npm run dev
```
Visit http://localhost:3000

## Project Structure (key paths)
- `app/` – App Router pages & API route handlers
- `components/` – UI components
- `lib/` – DB shim (Prisma-compatible wrapper over Sequelize) & auth config
- `scripts/seed.js` – Seed script (Sequelize)
- `prisma/dev.db` – Default SQLite storage path (kept for continuity)

## Extending
- Add real artwork: store URLs in `artworkUrl`
- Add real audio streaming integration
- Add bio editing UI gated by role
- Consider Postgres for production (requires adapting Sequelize config)

## Production Deployment & Docker

### Environment Variables
Required (example values):

| Name | Description |
|------|-------------|
| NEXTAUTH_SECRET | Random 32+ char secret (GUID ok) |
| NEXTAUTH_URL | Public base URL (e.g. https://example.com) |
| DATABASE_URL | SQLite file path (e.g., `file:./prisma/dev.db`) or another SQL URL |

SQLite (development / single-container only):
```
DATABASE_URL="file:./prisma/dev.db"
```

### Docker (Simple SQLite)
Build & run (not for scaling / multi-replica):
```powershell
docker build -t essential-mix-db .
docker run --rm -p 3000:3000 -e NEXTAUTH_SECRET=devsecret -e NEXTAUTH_URL=http://localhost:3000 essential-mix-db
```

Persist data by mounting the SQLite file:
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

### Docker + Postgres (Optional)
This project currently targets SQLite via Sequelize for simplicity. If you plan to run Postgres, you'll need to adapt the Sequelize initialization and models accordingly; there are no Prisma migrations in this branch.

### GHCR + Portainer (App + Embedded Postgres)
This repo includes a GitHub Actions workflow at `.github/workflows/ghcr.yml` that publishes your image to:

- `ghcr.io/<owner>/<repo>:latest` on pushes to default branch
- `ghcr.io/<owner>/<repo>:sha-<commit>` on each push
- `ghcr.io/<owner>/<repo>:<tag>` on version tags

#### 1) Enable GHCR publishing
- Push this repository to GitHub.
- Ensure Actions are enabled for the repo.
- The workflow uses `GITHUB_TOKEN` with `packages: write`; no extra PAT required for publishing from Actions.

#### 2) Deploy in Portainer (two containers)
Use `docker-compose.portainer.yml` as your stack file. It runs:
- `app` (frontend / Next.js container)
- `db` (Postgres 16 container)

Update these values before deploy:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- Postgres password in both `DATABASE_URL` and `POSTGRES_PASSWORD`

If GHCR package is private, add a registry credential in Portainer for `ghcr.io` and use a PAT with `read:packages`.

#### 3) First boot behavior
On first startup the app initializes schema via Sequelize `sync()` against Postgres.
No Prisma migration commands are required for this branch.

### Production Hardening Checklist
- Ensure strong `NEXTAUTH_SECRET`
- Set `NEXTAUTH_URL` to your public domain
- Add HTTPS termination (reverse proxy or platform TLS)
- Run `npm prune --omit=dev` if not using the provided multi-stage Dockerfile
- Add logging aggregation (stdout collector)
- Add metrics / health endpoint (optional)
- Back up the database (daily automated backups)
- Consider rate limiting review & auth endpoints

### Image Internals
The multi-stage Dockerfile produces a minimal final layer using Next.js standalone output. At runtime, the app lazily initializes a SQLite database via Sequelize. For SQLite, data persistence depends on volume mounts.

### Scaling Notes
SQLite is file-based; only use it for single-container dev or hobby deployments. For horizontal scaling (multiple replicas), use Postgres and (optionally) a connection pooler.

## License
MIT (Add a LICENSE file if needed.)
