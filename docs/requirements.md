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
| `/batches` | Batch history for authenticated users; unauthenticated users see an auth-gate dialog |

### Secure (auth required — redirects to `/sign-in` if no session)

| Route | Description |
|---|---|
| `/dashboard` | Main authenticated landing page |

## Fermentation Prediction (/predict)

- Accepts fermentation process parameters as input
- Calls the Python worker pool to generate quality predictions with confidence intervals
- Uses mock predictions by default (MODEL_MODE=mock in ai/.env); set MODEL_MODE=live to use a trained model
- When all workers are busy, requests are queued; the user sees their queue position and estimated wait time
- Predictions carry error bands — they are estimates, not guarantees
- Publicly accessible (no sign-in required)
- When a signed-in user runs a prediction, the result is silently auto-saved as a batch (no error shown if save fails)

### Input Fields (schema v0.2)

| Field | Type | Range | Description |
|---|---|---|---|
| `batch_id` | string | 1–100 chars | Identifier for the batch run |
| `rice_polish_ratio` | float | 30–100% | Rice polishing ratio |
| `koji_incubation_hours` | float | 12–60 | Koji incubation duration |
| `moromi_duration_days` | float | 10–120 | Moromi fermentation duration |
| `initial_temperature_c` | float | 5–20°C | Initial mash temperature |
| `water_ph` | float | 3.0–8.0 | Water pH |
| `water_hardness_ppm` | float | 5–100 ppm | Water hardness |
| `yeast_pitch_rate_cells_ml` | float | > 0 | Yeast pitch rate (cells/mL) |

### Output Fields (schema v0.2)

| Field | Description |
|---|---|
| `predicted_quality_score` | Overall quality score, 1–5 scale |
| `prediction_error_band` | Confidence interval around the quality score |
| `estimated_final_brix` | Estimated residual sugar (Brix) |
| `estimated_final_acidity` | Estimated final acidity |
| `estimated_amino_acidity` | Estimated amino acid content |
| `predicted_texture_astringency` | Texture/astringency prediction |
| `predicted_alcohol_burn_intensity` | Alcohol burn intensity prediction |
| `predicted_floral_probability` | Probability of floral character |
| `predicted_off_flavor_probability` | Probability of off-flavor |
| `qc_flags` | Array of quality control flag strings |
| `model_version` | AI model version that generated the prediction |
| `schema_version` | Schema version used (e.g., `v0.2`) |

## Batches (/batches)

- Accessible without sign-in, but unauthenticated users see a non-dismissable dialog explaining the feature and prompting sign-in
- Authenticated users see their full batch history in a table

**Batch persistence:**
- A batch is a saved prediction run — when a signed-in user submits a prediction on `/predict`, it is automatically saved or updated
- Keyed by `(userId, batchId)` — submitting with an existing batch ID overwrites the stored parameters and results
- Each batch stores: input parameters, prediction results, quality score (1–5 scale), QC status, QC flags, model version, schema version

**Batch list table:**
- Columns: Batch ID, Quality Score, QC Status, Updated date
- Ordered by most recently updated
- Clicking a row opens the batch detail drawer

**Batch detail drawer:**
- Right-side Sheet showing input parameters (read-only) and prediction results
- Reuses the `PredictionResults` component

**CSV upload:**
- Upload area on the Batches page accepts a CSV file
- CSV contains rows of parameters, each with an individual `batch_id`
- Each row is processed consecutively through the Python worker pool
- A queue position indicator shows while the upload slot is waiting for an available worker
- Results appear in the batch list after processing
- Maximum 100 rows per upload; validation errors shown inline before submission

**Ownership and security:**
- All batch data is scoped to the authenticated user
- Ownership is checked on every read/write API operation
- Requests from non-owners return 404 (no existence leaking)

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
