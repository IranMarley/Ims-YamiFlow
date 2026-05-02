# ── web-client/Dockerfile · Next.js production build ──────────────────────────
# Requires `output: 'standalone'` in next.config.ts

# ── 1. Dependencies ────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── 2. Builder ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Public env vars must be available at build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_STRIPE_PLAN_MONTHLY_ID
ARG NEXT_PUBLIC_STRIPE_PLAN_ANNUAL_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_STRIPE_PLAN_MONTHLY_ID=$NEXT_PUBLIC_STRIPE_PLAN_MONTHLY_ID
ENV NEXT_PUBLIC_STRIPE_PLAN_ANNUAL_ID=$NEXT_PUBLIC_STRIPE_PLAN_ANNUAL_ID
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── 3. Runner ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
