FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Database migrations run against the live PostgreSQL service before web startup.
FROM base AS migrator
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/core/package.json ./apps/core/
COPY packages/client/package.json ./packages/client/
COPY apps/core/prisma ./apps/core/prisma
COPY apps/core/migrations ./apps/core/migrations
COPY apps/core/prisma.config.ts ./apps/core/prisma.config.ts
WORKDIR /app/apps/core
ENV NODE_ENV=production
RUN npm install @prisma/orm-postgres prisma --legacy-peer-deps
CMD ["npx", "prisma", "db", "migrate"]

# Build
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/client ./packages/client
COPY apps/core ./apps/core
RUN npm install --workspace=apps/core --workspace=packages/client --legacy-peer-deps
RUN npm run build:client
WORKDIR /app/apps/core
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/core/public ./apps/core/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/core/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/core/.next/static ./apps/core/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "apps/core/server.js"]
