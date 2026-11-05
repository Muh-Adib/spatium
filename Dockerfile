# syntax=docker/dockerfile:1
# UNIMASI Studio — multi-stage production image (Next.js 16 standalone with pnpm)

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are inlined at build time — pass them as build args.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CORE_URL
ARG NEXT_PUBLIC_CORE_SITE_KEY
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_WHATSAPP
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CORE_URL=$NEXT_PUBLIC_CORE_URL \
    NEXT_PUBLIC_CORE_SITE_KEY=$NEXT_PUBLIC_CORE_SITE_KEY \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_WHATSAPP=$NEXT_PUBLIC_WHATSAPP \
    NEXT_TELEMETRY_DISABLED=1

# Prisma contract generation needs no DB connection.
RUN pnpm dlx prisma contract emit || true
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN apk add --no-cache openssl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts* ./
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

ENTRYPOINT ["./entrypoint.sh"]
