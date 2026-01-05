# SaveMate — Deals Marketplace (Monorepo)

SaveMate is a full‑stack “deals marketplace” application built as a single `pnpm` monorepo.

At a high level:

- **Backend:** Express + TypeScript + Prisma (MongoDB)
- **Frontend:** React (Vite) + TypeScript
- **Contract:** Zod schemas as the single source of truth → OpenAPI generation → typed API client

The product is role-based:

- **USER**: browse deals and view deal details
- **BUSINESS**: create/manage your own deals
- **ADMIN**: moderate deals and manage categories

---

## 1‑Minute Quickstart

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm -C apps/backend exec prisma db push
pnpm -C apps/backend exec prisma db seed
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Health check: http://localhost:4000/health

---

## Features (by area)

### Public (no login)

- Deals feed with pagination (`page` + `limit`)
- Filters: keyword search, category, city, voivodeship, price range, discount minimum, tags, date range, sorting
- Deal details page
- Public categories list

### Authentication

- Register + Login
- **Access token** returned from backend and attached as `Authorization: Bearer ...`
- **Refresh token** stored as an `httpOnly` cookie (rotated on refresh)
- Frontend Axios interceptor automatically refreshes the access token on 401 (except logout)

### Business

- Create a deal
- Update a deal
- Delete a deal
- List “my deals” with pagination and filters

### Admin

- Pending deals queue
- Approve a deal
- Reject a deal (requires a reason)
- “All deals” page: list all deals with pagination and status management
- Categories CRUD (create / edit / delete)
- Audit logs created for admin actions (deal moderation + category changes)

---

## Tech Stack

### Backend

- Node.js + Express
- Prisma ORM (MongoDB)
- Zod validation middleware for query/body/params
- Helmet + CORS + rate limiting
- Pino HTTP logging + request IDs (`x-request-id`)
- Local static uploads served from `/uploads`

### Frontend

- React + Vite + TypeScript
- TanStack React Query for data fetching + caching
- Axios client with auth/refresh interceptor
- UI primitives via Tailwind + Radix (dialogs/dropdowns)

### Shared packages (workspace deps)

- `@savemate/shared-validation`: Zod schemas + OpenAPI registry
- `@savemate/api-client`: generated OpenAPI TypeScript types
- `@savemate/config`: shared ESLint/TS/Prettier configuration

---

## Repository Structure

```
apps/
  backend/                # Express API + Prisma schema/seed
    prisma/
    src/
  frontend/               # React UI (Vite)
    src/
packages/
  shared-validation/      # Zod schemas (shared by backend + frontend)
  api-client/             # OpenAPI generated TS types
  config/                 # Shared tooling configs
```

---

## Architecture & Code Dynamics

### Backend request lifecycle

Most routes follow the same flow:

```
HTTP request
  -> route handler (apps/backend/src/routes/*)
  -> validateQuery / validateBody / validateParams (Zod)
  -> service layer (apps/backend/src/services/*)
  -> repository layer (apps/backend/src/repositories/*)
  -> Prisma (MongoDB)
  -> consistent JSON response
```

This separation keeps:

- **Routes** focused on HTTP concerns (auth, validation, status codes)
- **Services** focused on business rules (status transitions, permissions)
- **Repositories** focused on database queries (filters, pagination, selects)

### Frontend data lifecycle

The public deals browsing flow is representative:

```
URL search params
  -> parsed into typed query state (filters/pagination)
  -> useDealsFeed(searchKey, query)
  -> api/deals.ts wrapper (Axios)
  -> backend /deals
  -> React Query cache keyed by ["deals", searchKey]
  -> UI renders cards + pagination
```

Key points:

- Filters are reflected in the URL, so you can share links like `/deals?categoryId=...&page=2`.
- React Query uses `keepPreviousData` to reduce UI flicker during pagination.

---

## Environment Variables

This repo reads env vars from the **root** `.env` file.

### Backend

| Variable                 | Example                                                         | Purpose                         |
| ------------------------ | --------------------------------------------------------------- | ------------------------------- |
| `PORT`                   | `4000`                                                          | Backend HTTP port               |
| `DATABASE_URL`           | `mongodb://root:root@localhost:27017/savemate?authSource=admin` | Prisma Mongo connection string  |
| `JWT_ACCESS_SECRET`      | `change-me`                                                     | HMAC secret for access tokens   |
| `JWT_REFRESH_SECRET`     | `change-me`                                                     | HMAC secret for refresh tokens  |
| `ACCESS_TOKEN_TTL_MIN`   | `15`                                                            | Access token TTL in minutes     |
| `REFRESH_TOKEN_TTL_DAYS` | `14`                                                            | Refresh token TTL in days       |
| `CORS_ORIGIN`            | `http://localhost:5173`                                         | Comma-separated allowed origins |

### Frontend

| Variable       | Example                 | Purpose                        |
| -------------- | ----------------------- | ------------------------------ |
| `VITE_API_URL` | `http://localhost:4000` | Backend base URL used by Axios |

### Seed (optional)

| Variable                 | Example                    | Purpose                                  |
| ------------------------ | -------------------------- | ---------------------------------------- |
| `SEED_ADMIN_EMAIL`       | `admin@savemate.local`     | Admin user email created/updated by seed |
| `SEED_ADMIN_PASSWORD`    | `admin123456-change-me`    | Admin user password                      |
| `SEED_BUSINESS_EMAIL`    | `business@savemate.local`  | Business user email                      |
| `SEED_BUSINESS_PASSWORD` | `business123456-change-me` | Business user password                   |

---

## Auth Model (how it works)

SaveMate uses a typical “short‑lived access token + long‑lived refresh token” model.

### Login/Register

- `POST /auth/login` and `POST /auth/register` return `{ accessToken }`.
- They also set a refresh cookie:
  - cookie name: `refreshToken`
  - `httpOnly: true`
  - `sameSite: lax`
  - cookie path: `/auth/refresh`

### Frontend behavior

- The frontend stores the access token in a lightweight auth store.
- All API requests attach `Authorization: Bearer <token>`.
- On a 401:
  1. Axios calls `POST /auth/refresh` (cookie is automatically sent via `withCredentials: true`).
  2. If refresh succeeds, the request is retried with the new access token.
  3. If refresh fails, the user is redirected to `/login`.

This keeps refresh tokens out of JavaScript (httpOnly cookie), while access tokens remain easy to attach.

---

## Error Handling & Observability

### Consistent error envelope

All handled backend errors return a consistent JSON shape:

```json
{
  "error": {
    "code": "UNAUTHORIZED|FORBIDDEN|NOT_FOUND|CONFLICT|VALIDATION_ERROR|INTERNAL",
    "message": "Human readable message",
    "details": {},
    "requestId": "..."
  }
}
```

### Request IDs

- Backend assigns or propagates `x-request-id`.
- The frontend also tries to surface `requestId` from errors (helpful for debugging logs).

### Rate limiting

Backend applies a basic rate limit (per minute) to reduce abuse during development.

---

## Uploads (images)

- Backend serves static files from `/uploads`.
- Images referenced by deals typically use paths like `/uploads/seed/...`.
- The frontend resolves images against `VITE_API_URL`, e.g.:
  - `http://localhost:4000` + `/uploads/seed/deal-food-01.svg`

Dev note:

- Frontend and backend run on different origins in dev. The backend sets
  `Cross-Origin-Resource-Policy: cross-origin` for `/uploads` to prevent the browser from blocking images.

---

## API Overview (detailed)

### Pagination format

List endpoints return:

```json
{
  "items": [
    /* ... */
  ],
  "page": {
    "page": 1,
    "limit": 10,
    "total": 123,
    "totalPages": 13
  }
}
```

### Public endpoints

- `GET /health` → `{ ok: true }`
- `GET /categories` → `{ items: Category[] }`
- `GET /deals`
  - supports filters like `q`, `categoryId`, `city`, `voivodeship`, `minPrice`, `maxPrice`, `discountMin`, `tags`, `dateFrom`, `dateTo`, `sort`, plus `page`/`limit`
- `GET /deals/:id` → deal details

### Auth endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh` (uses refresh cookie)
- `POST /auth/logout` (clears refresh cookie)
- `POST /auth/forgot` (dev may return a reset token)
- `POST /auth/reset`

### Business endpoints (requires `BUSINESS`)

- `GET /business/deals` (lists only the authenticated business’s deals)
- `POST /business/deals` (create)
- `PATCH /business/deals/:id` (update)
- `DELETE /business/deals/:id` (delete)

### Admin endpoints (requires `ADMIN`)

- `GET /admin/deals/pending` (pending queue)
- `POST /admin/deals/:id/approve` (only allowed for PENDING)
- `POST /admin/deals/:id/reject` (only allowed for PENDING; requires `reason`)
- `GET /admin/deals` (all deals; optional status filter)
- `PATCH /admin/deals/:id/status` (status update; REJECTED requires `reason`)
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:id`
- `DELETE /admin/categories/:id`

---

## RBAC (Role-Based Access Control)

- `requireAuth` reads the `Authorization: Bearer ...` header and verifies the access token.
- `requireRole("ADMIN")` / `requireRole("BUSINESS")` enforce role restrictions.

Business convenience behavior:

- If a user is `BUSINESS` but the token payload doesn’t include a `businessId`, the backend resolves it from the database and attaches it to the request.

---

## Data Model (conceptual)

Core entities:

- **User** (`ADMIN | USER | BUSINESS`)
- **BusinessProfile** (attached to a business user)
- **Category** (name + slug)
- **Deal** (belongs to a business + category)
- **AuditLog** (records admin moderation/category actions)

Deal status lifecycle:

- `DRAFT` → `PENDING` → `APPROVED`
- `REJECTED` (admin requires a reason)
- `EXPIRED` (used for past deals)

---

## Local Development (recommended)

### Prerequisites

- Node.js 18+ (or newer)
- `pnpm` (workspace uses pnpm)
- Docker (for MongoDB)

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment variables

Create a local `.env` in the repo root:

```bash
cp .env.example .env
```

### 3) Start MongoDB (replica set)

```bash
pnpm db:up
```

Why replica set?

- The docker compose file starts MongoDB with `--replSet rs0` and runs an init container to call `rs.initiate(...)`.
- This matches common Prisma MongoDB requirements when transactions are needed.

### 4) Push schema + seed

```bash
pnpm -C apps/backend exec prisma db push
pnpm -C apps/backend exec prisma db seed
```

The seed creates:

- Categories
- An admin user and a few business users
- A set of realistic deals with all major fields filled
- Seed images in `apps/backend/uploads/seed`

### 5) Run the full stack

```bash
pnpm dev
```

Dev note:

- Backend dev command is `tsx src/server.ts` and does not provide hot reload by default.
- If you change backend code and don’t see it reflected, restart the backend dev process.

---

## Contract Sync (OpenAPI + Types)

This repo treats **Zod schemas** as the canonical contract.

Generation pipeline:

1. Backend generates OpenAPI JSON from Zod
2. Frontend/client regenerates OpenAPI TypeScript types

Run the entire pipeline:

```bash
pnpm contract:sync
```

Individual steps:

```bash
pnpm openapi:generate
pnpm openapi:types
```

Where artifacts live:

- Backend: `apps/backend/openapi.json`
- Types: `packages/api-client/src/generated/*`

---

## Common Developer Workflows

### Add a new endpoint (recommended process)

1. Add/extend Zod schemas in `packages/shared-validation`
2. Use schemas in backend route validation
3. Implement service/repository logic
4. Regenerate contract + types: `pnpm contract:sync`
5. Update frontend API wrappers + UI

### Change a deal filter

1. Update the shared `DealsQuerySchema` (and types)
2. Update backend repository filter builder
3. Update frontend URL parsing + `useDealsFeed` mapping

---

## Useful Commands

From repo root:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm format
pnpm build
pnpm db:up
pnpm db:down
```

Backend-only:

```bash
pnpm -C apps/backend dev
pnpm -C apps/backend openapi:generate
pnpm -C apps/backend exec prisma db push
pnpm -C apps/backend exec prisma db seed
```

Frontend-only:

```bash
pnpm -C apps/frontend dev
pnpm -C apps/frontend build
pnpm -C apps/frontend preview
```

Note about “build”:

- Frontend build produces a Vite production bundle.
- Backend `build` currently runs TypeScript typechecking (`tsc --noEmit`).
  If you plan to deploy, you’ll likely want a real backend build step that emits JS.

---

## Troubleshooting

### Images not loading in admin/public UI

- Backend serves images at `/uploads`.
- Ensure `VITE_API_URL` points to the backend.
- Ensure deal `imageUrl` values look like `/uploads/...`.

### CORS issues

- Backend reads `CORS_ORIGIN` (comma-separated list).
- For local dev it should include `http://localhost:5173`.

### MongoDB / Prisma issues

- Prisma + MongoDB commonly needs a replica set.
- Use `pnpm db:up` (docker compose includes a replica set init container).

### “Why is my backend change not showing up?”

- The backend dev script uses `tsx` without hot reload.
- Restart the backend process.

---

## License

Internal / project-specific. Add a license if you plan to open-source.
