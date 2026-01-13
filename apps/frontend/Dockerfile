# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS build
WORKDIR /repo

RUN corepack enable

# Build-time API URL for Vite. IMPORTANT: Vite injects env at build time.
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/shared-validation/package.json packages/shared-validation/package.json
COPY packages/config/package.json packages/config/package.json

RUN pnpm install --frozen-lockfile

# Copy sources
COPY . .

# Build the frontend
RUN pnpm -C apps/frontend build


FROM nginx:1.27-alpine AS runtime
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
