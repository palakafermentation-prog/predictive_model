# Architecture

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | BetterAuth 1.4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS 4 |
| Forms | react-hook-form + Zod |
| State | Zustand (client stores) |
| Email | Nodemailer |
| File processing | sharp |
| AI service | Python (Hono-based HTTP service) |
| Package manager | pnpm (monorepo with Turborepo) |

## Application Structure

```
flowchart TD
    subgraph Browser
        UI[React Components]
        Store[Zustand Stores]
        FE[services/frontend]
    end

    subgraph NextJS["Next.js App"]
        subgraph Routes["App Router"]
            Public["(public) — auth pages"]
            Open["(open) — unauthenticated app"]
            Secure["(secure) — authenticated app"]
        end
        API[API Routes\n/api/auth/*\n/api/profile\n/api/media/*\n/api/predictions\n/api/batches/*\n/api/health]
        BE[services/backend]
        Lib[lib/\nauth · prisma · email · env]
    end

    subgraph Data
        PG[(PostgreSQL)]
        FS[File System\nuploads/]
    end

    AI[AI Service\nservices/ai/]

    UI --> FE --> API
    API --> BE --> Lib
    Lib --> PG
    Lib --> FS
    API --> AI
```

## Authentication Architecture

BetterAuth manages the core auth flow. A thin service layer wraps it with custom business logic.

```
flowchart TD
    Request --> API["API Route\n/api/auth/*"]
    API --> AuthSvc["auth.service.ts"]
    AuthSvc --> BetterAuth["BetterAuth\nlib/auth.ts"]
    BetterAuth --> PrismaAdapter["Prisma Adapter"]
    PrismaAdapter --> DB[(PostgreSQL)]
    BetterAuth --> Email["lib/email.ts\nNodemailer"]
```

**Auth models in PostgreSQL:**

| Table | Purpose |
|---|---|
| `auth_user` | Identity record (email, emailVerified, role) |
| `auth_session` | Active sessions with token + expiry |
| `auth_account` | Credential/OAuth accounts (password hash stored here) |
| `auth_verification` | Email verification and password reset tokens |
| `user` | App profile (firstName, lastName, phone, avatar) linked to `auth_user` |

## Registration and Email Verification Flow

```
sequenceDiagram
    participant Browser
    participant API as /api/auth/signup
    participant AuthSvc as auth.service.ts
    participant BetterAuth
    participant DB as PostgreSQL
    participant Email as Nodemailer

    Browser->>API: POST {email, password, firstName, lastName}
    API->>AuthSvc: signup()
    AuthSvc->>BetterAuth: signUpEmail()
    BetterAuth->>DB: INSERT auth_user (emailVerified=false)
    BetterAuth->>DB: INSERT auth_verification (token)
    BetterAuth->>Email: sendVerificationEmail(token)
    AuthSvc->>DB: INSERT user (userType=user)
    API-->>Browser: 201 {message}

    Browser->>API: GET /api/auth/verify-email?token=...
    API->>AuthSvc: verifyEmail(token)
    AuthSvc->>BetterAuth: verifyEmail()
    BetterAuth->>DB: UPDATE auth_user SET emailVerified=true
    BetterAuth->>DB: DELETE auth_verification (token consumed)
    API-->>Browser: Redirect /sign-in?verified=1
```

## Database Schema

```
erDiagram
    AuthUser {
        string id PK
        string email UK
        boolean emailVerified
        string role
    }
    AuthSession {
        string id PK
        string userId FK
        string token UK
        datetime expiresAt
    }
    AuthAccount {
        string id PK
        string userId FK
        string password
    }
    AuthVerification {
        string id PK
        string identifier
        string value
        datetime expiresAt
    }
    User {
        string id PK
        string authUserId FK
        enum userType
        string firstName
        string lastName
        string avatarId FK
    }
    Batch {
        string id PK
        string userId FK
        string batchId
        json parameters
        json predictions
        float qualityScore
        string qcStatus
        json qcFlags
    }
    MediaFile {
        string id PK
        string relativePath
        string mimeType
        int sizeBytes
        string createdBy FK
    }

    AuthUser ||--o{ AuthSession : "has"
    AuthUser ||--o{ AuthAccount : "has"
    AuthUser ||--|| User : "linked to"
    User ||--o{ Batch : "owns"
    User ||--o{ MediaFile : "creates"
    User }o--o| MediaFile : "avatar"
```

## Service Layer

All business logic lives in `src/services/`. API routes call services; services call `lib/` infrastructure.

| Service | Location | Responsibility |
|---|---|---|
| `auth.service.ts` | `services/backend/` | signup, signin, signout, session, verify email, resend, forgot/reset password |
| `profile.service.ts` | `services/backend/` | Get and update user profile |
| `media.service.ts` | `services/backend/` | Upload, retrieve, delete media files |
| `prediction.service.ts` | `services/backend/` | Call AI service (or mock) for fermentation predictions |
| `batch.service.ts` | `services/backend/` | Batch CRUD, upsert, and CSV upload processing |
| `db.service.ts` | `services/backend/` | Shared DB query helpers |
| `permissions.ts` | `services/backend/` | `requireSuperAdmin()` and `requireOwner()` guards |
| `auth.ts` | `services/frontend/` | Client-side auth API calls |
| `media.ts` | `services/frontend/` | Client-side media upload/fetch |
| `prediction.ts` | `services/frontend/` | Client-side prediction calls |
| `batch.ts` | `services/frontend/` | Client-side batch list, fetch, delete, and CSV upload |

## Monorepo Packages

| Package | Description |
|---|---|
| `@pferm/shared-schemas` | Zod schemas for validation — shared between Next.js app and AI service |
| `@pferm/shared-lib` | ID generator utilities (nanoid-based prefixed IDs) |
| `@pferm/typescript-config` | Shared `tsconfig.json` base configurations |

## Route Groups

| Group | Auth | Purpose |
|---|---|---|
| `(public)` | None | Auth pages: sign-in, sign-up, verify-email, forgot/reset password |
| `(open)` | None | Public app pages — `/predict` and `/batches` |
| `(secure)` | Required | Authenticated app — redirects to `/sign-in` via `SecureLayout` |

## AI Service

`services/ai/` is an independent Python HTTP service. The Next.js app calls it via `lib/ai-client.ts`.

- When `AI_SERVICE_URL` env var is set: requests are proxied to the AI service
- When `AI_SERVICE_URL` is not set: `prediction-mock.ts` generates synthetic responses

See `services/ai/.env.example` for service configuration.
