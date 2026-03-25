# P-Ferm

Palaka Fermentation — a web application for fermentation quality prediction and process management.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: BetterAuth (email/password with email verification)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Package manager**: pnpm (monorepo)
- **AI service**: Python service (see `services/ai/`) — mocked when not configured

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
│   │   ├── backend/            # Server-side business logic (auth, profile, media, predictions)
│   │   └── frontend/           # Client-side API wrappers
│   └── lib/                    # Infrastructure: auth config, Prisma client, email, env
├── prisma/                     # Schema and migrations
├── services/
│   └── ai/                     # Python AI service
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

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env — set DATABASE_URL, BETTER_AUTH_SECRET, and SMTP credentials
   ```

3. **Run migrations and seed:**
   ```bash
   pnpm db:migrate
   pnpm db:generate
   pnpm db:seed
   ```

   The seed script creates a super_admin user using `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_FIRST_NAME` from `.env`.

4. **Start dev server:**
   ```bash
   pnpm dev
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
| `AI_SERVICE_URL` | Python AI service URL — omit to use mock predictions |
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

## AI Service (Optional)

The AI service lives in `services/ai/`. When `AI_SERVICE_URL` is not set, predictions use a mock implementation.

See `services/ai/.env.example` for service configuration.
