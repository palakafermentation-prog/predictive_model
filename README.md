# P-Ferm

Palaka Fermentation — a web application for fermentation quality prediction and process management.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: BetterAuth (email/password with email verification)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Package manager**: pnpm (monorepo)
- **AI service**: Python worker pool (`ai/`) — long-lived workers via stdin/stdout; `AI_WORKER_COUNT` controls concurrency

## Monorepo Structure

```
p-ferm-code/
├── src/                        # Next.js app
│   ├── app/                    # App Router pages and API routes
│   │   ├── (public)/           # Unauthenticated pages (sign-in, sign-up, etc.)
│   │   ├── (open)/             # Public app pages (no auth required)
│   │   └── (secure)/           # Authenticated pages (redirects to /sign-in if no session)
│   ├── components/             # Shared React components
│   ├── services/
│   │   ├── backend/            # Server-side business logic (auth, profile, media, predictions, batches)
│   │   └── frontend/           # Client-side API wrappers
│   └── lib/                    # Infrastructure: auth config, Prisma client, email, env
├── ai/                         # Python worker pool (worker.py, ml/, schemas.py)
├── prisma/                     # Schema and migrations
└── packages/
    ├── shared-schemas/         # Zod schemas shared across app and services
    ├── shared-lib/             # Shared utilities (ID generators, etc.)
    └── typescript-config/      # Shared TypeScript config
```

## Prerequisites

- Node.js (see `.node-version`)
- pnpm
- PostgreSQL

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up Python workers:**
   ```bash
   pnpm setup:ai
   # Installs numpy, pandas, scikit-learn, joblib in ai/.venv via uv
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env — set DATABASE_URL, BETTER_AUTH_SECRET, SMTP credentials, and AI_WORKER_COUNT
   cp ai/.env.example ai/.env
   # ai/.env defaults to MODEL_MODE=mock — no changes needed for local dev
   ```

4. **Run migrations and seed:**
   ```bash
   pnpm db:migrate
   pnpm db:generate
   pnpm db:seed
   ```

   The seed script creates a super_admin user using `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_FIRST_NAME` from `.env`.

5. **Start dev server:**
   ```bash
   pnpm dev
   # Python workers spawn automatically when the Next.js app starts
   ```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_URL` | App base URL (e.g., `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Auth secret — generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL for client-side requests |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (typically 587) |
| `SMTP_USERNAME` | SMTP credentials |
| `SMTP_PASSWORD` | SMTP credentials |
| `EMAIL_FROM` | From address for system emails |
| `FILE_UPLOADS_PATH` | Local path for uploaded files (e.g., `./uploads`) |
| `AI_WORKER_COUNT` | Number of Python worker processes to spawn (1–5, default 3) |
| `SEED_ADMIN_EMAIL` | Super admin email (dev only) |
| `SEED_ADMIN_PASSWORD` | Super admin password (dev only) |
| `SEED_ADMIN_FIRST_NAME` | Super admin first name (dev only) |

## Database Commands

```bash
pnpm db:migrate       # Run pending migrations
pnpm db:generate      # Regenerate Prisma client
pnpm db:seed          # Seed super_admin user
pnpm db:studio        # Open Prisma Studio
pnpm db:reset         # Reset and re-run all migrations
```

## Type Checking

```bash
pnpm type-check
```

## Python Worker Pool

Predictions are handled by long-lived Python worker processes in `ai/`. Node spawns them on startup and communicates via stdin/stdout JSON lines.

**Scripts:**
```bash
pnpm setup:ai    # Install Python deps (run once, or after pyproject.toml changes)
pnpm dev:ai      # Run a single worker standalone for manual testing
```

**Configuration** (`ai/.env`, see `ai/.env.example`):

| Variable | Description |
|---|---|
| `MODEL_MODE` | `mock` (default) or `live` |
| `MODEL_DIR` | Path to trained model artifacts (required for `MODEL_MODE=live`, default: `ai/ml/models/trained`) |
| `MODEL_DIR_ALLOW_EXTERNAL` | Set to `1` to allow `MODEL_DIR` outside the `ai/` workspace (production deployments) |

Workers spawn automatically when `pnpm dev` starts. `AI_WORKER_COUNT` in root `.env` controls how many workers run concurrently.

### Updating the vendored ML model

`ai/palaka_model/` is a drop-in copy of the external ML team's Python package and `ai/ml/models/trained/` holds the trained model artifacts. When the ML team ships an update:

```bash
rm -rf ai/palaka_model && cp -r <ml-repo>/palaka_model ai/palaka_model
cp <ml-repo>/artifacts/*.joblib <ml-repo>/artifacts/model_registry.json ai/ml/models/trained/
```

No code edits required — the layout mirrors upstream byte-for-byte.
