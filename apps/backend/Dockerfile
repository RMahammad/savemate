# syntax=docker/dockerfile:1.7

# Backend runs TypeScript via tsx (this repo uses noEmit tsconfig).
# If you later switch to emitting dist JS, you can replace CMD with node dist/server.js.

FROM node:20-bookworm-slim AS base
WORKDIR /repo

# Native deps for argon2 / prisma engines
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable

# ---- deps ----
FROM base AS deps

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/shared-validation/package.json packages/shared-validation/package.json
COPY packages/config/package.json packages/config/package.json

# Install deps for the backend + its workspace deps
RUN pnpm install --frozen-lockfile

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production

# Copy full repo (source needed because backend runs TS)
COPY . .

# Bring in node_modules from deps stage
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /repo/packages/api-client/node_modules ./packages/api-client/node_modules
COPY --from=deps /repo/packages/shared-validation/node_modules ./packages/shared-validation/node_modules
COPY --from=deps /repo/packages/config/node_modules ./packages/config/node_modules

WORKDIR /repo/apps/backend

# Ensure Prisma client is generated (Mongo provider)
RUN pnpm prisma generate

# Default upload dir inside container; mount a persistent volume here in prod
ENV UPLOADS_DIR=/data/uploads
RUN mkdir -p /data/uploads

EXPOSE 4000

# Required runtime envs (set in docker-compose / DO):
# - DATABASE_URL
# - JWT_ACCESS_SECRET
# - JWT_REFRESH_SECRET
# Optional:
# - PORT (default 4000)
# - CORS_ORIGIN (comma-separated)
# - ACCESS_TOKEN_TTL_MIN, REFRESH_TOKEN_TTL_DAYS

CMD ["pnpm", "dev"]
