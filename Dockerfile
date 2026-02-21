## Multi-stage production build for Essential Mix DB (Next.js 14 + Sequelize)
## Supports SQLite (file:...) and Postgres (postgres://...)

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
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_SHARP_PATH="/app/node_modules/sharp"

# Copy only the standalone production output and minimal assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
#recomit