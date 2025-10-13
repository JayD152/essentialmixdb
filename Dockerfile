## Multi-stage production build for Essential Mix DB (Next.js 14 + Prisma)
## Default uses SQLite file inside container (not ideal for horizontal scaling).
## For production at scale, switch DATABASE_URL to a managed Postgres instance.

ARG NODE_VERSION=20.11.1
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
ENV CI=true
COPY package*.json ./
RUN npm install --no-audit --no-fund

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client (binary targets match build platform) and build Next.js
RUN npx prisma generate
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
COPY --from=builder /app/node_modules ./node_modules
    PORT=3000 \
    NEXT_SHARP_PATH="/app/node_modules/sharp"

# Copy only the standalone production output and minimal assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
#COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
