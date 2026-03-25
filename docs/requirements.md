# Product Requirements

## User Roles

| Role | Description |
|---|---|
| `user` | Standard authenticated user — can access the app, run predictions, manage own profile |
| `super_admin` | Administrator — created exclusively via seed script; full system access |

**Permission rules:**
- Super admin can access all resources
- Regular users can only access their own resources (profile, media)
- Super admin is never assigned through registration — only via `pnpm db:seed`

## Authentication

### Registration (/sign-up)
- Fields: first name (required), last name (optional), email (required), password (required, min 8 chars), confirm password
- Email serves as the username and must be unique in the system
- On submit: creates user account, sends verification email, shows verification pending message
- Link from sign-in page to sign-up page and vice versa

### Email Verification (/verify-email)
- Users must verify their email before they can sign in
- Verification link format: `/verify-email?token={token}`
- Clicking the link verifies the email and redirects to sign-in with success message
- Expired tokens show an error with option to resend

### Sign-In (/sign-in)
- Fields: email, password
- Unverified users cannot sign in — shown a clear message: "Please verify your email before signing in"
- Resend verification button appears alongside the unverified message
- On success: redirects to `/dashboard`

### Sign-Out
- Ends the session and redirects to sign-in

### Forgot Password (/forgot-password)
- User enters email; system sends reset link if account exists
- Response is always success (no user enumeration)

### Reset Password (/reset-password)
- User lands via email link containing reset token
- Sets new password; redirected to sign-in on success
- Expired/invalid tokens show error

## Pages and Screens

### Public (no auth required)

| Route | Description |
|---|---|
| `/sign-in` | Email/password sign-in with forgot password link |
| `/sign-up` | New user registration form |
| `/verify-email` | Handles verification token callback from email link |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password using token from email |
| `/predict` | Fermentation quality prediction tool (accessible without account) |

### Secure (auth required — redirects to `/sign-in` if no session)

| Route | Description |
|---|---|
| `/dashboard` | Main authenticated landing page |

## Fermentation Prediction (/predict)

- Accepts fermentation process parameters as input
- Calls AI service to generate quality predictions with confidence intervals
- Falls back to mock predictions when AI service is unavailable
- Predictions carry error bands — they are estimates, not guarantees
- Publicly accessible (no sign-in required)

## User Profile

- Authenticated users can view and edit their own profile
- Fields: first name, last name, phone, avatar image
- Avatar upload: image is cropped and resized before storage
- Changes saved via `PATCH /api/profile`

## Media Uploads

- Supported by authenticated users only
- Images are processed (resized, compressed) on upload using sharp
- Maximum file size: configurable via `MEDIA_MAX_FILE_SIZE` env var (default 5 MB)
- Maximum dimensions: configurable via `MEDIA_MAX_WIDTH` / `MEDIA_MAX_HEIGHT` (default 800×800)
- Stored at `FILE_UPLOADS_PATH` (local filesystem)
- Served via `GET /api/media/{id}`

## System-Wide Rules

- All new users register with `user` role
- Email verification is required before first sign-in
- Sessions expire after 7 days; refreshed automatically if active within 1 day
- Authentication supports both cookie-based (browser) and Bearer token (API) flows
- All form validation uses Zod schemas from the `@pferm/shared-schemas` package
- Resend verification and forgot password responses never reveal whether an email is registered
- Password reset and verification tokens are managed by BetterAuth and stored in `auth_verification`
