/**
 * ID Generation Module
 *
 * Cross-platform ID generation using Web Crypto API.
 * Format: prefix-[19-random-chars]
 * Total length: 21-32 characters (1-12 char prefix + hyphen + 19 random chars)
 *
 * Uses crypto.getRandomValues() for compatibility with Node.js 20+,
 * browsers, and Capacitor WebView environments.
 */

const RANDOM_LENGTH = 19;
const MAX_PREFIX_LENGTH = 12;
const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join("");
}

/**
 * Generates a unique ID with the specified prefix.
 * @param prefix - 1-12 character prefix (auto-lowercased)
 * @returns ID in format: prefix-[19-random-chars] (max 32 chars total)
 */
export function generateId(prefix: string): string {
  if (!prefix || prefix.length === 0) {
    throw new Error("Prefix must be at least 1 character");
  }

  if (prefix.length > MAX_PREFIX_LENGTH) {
    throw new Error(
      `Prefix must be ${MAX_PREFIX_LENGTH} characters or less, got ${prefix.length}`
    );
  }

  const normalizedPrefix = prefix.toLowerCase();
  return `${normalizedPrefix}-${generateRandomString(RANDOM_LENGTH)}`;
}

/**
 * ID Prefixes for all entity types.
 *
 * Database table mappings:
 * - AUTH_USER → auth_users (AuthUser model - BetterAuth)
 * - SESSION → auth_sessions (AuthSession model - BetterAuth)
 * - ACCOUNT → auth_accounts (AuthAccount model - BetterAuth OAuth)
 * - VERIFICATION → auth_verifications (AuthVerification model - BetterAuth)
 * - USER → users (User model - application user profile)
 * - MEDIA_FILE → media_files (MediaFile model)
 * - BATCH → batch (Batch model)
 */
export const ID_PREFIXES = {
  AUTH_USER: "authus",
  AUTH_SESSION: "authse",
  AUTH_ACCOUNT: "authac",
  AUTH_VERIFICATION: "authve",
  USER: "us",
  MEDIA_FILE: "media",
  BATCH: "batch",
} as const;

// Type-safe ID generators for each entity
export const generateAuthUserId = () => generateId(ID_PREFIXES.AUTH_USER);
export const generateSessionId = () => generateId(ID_PREFIXES.AUTH_SESSION);
export const generateAccountId = () => generateId(ID_PREFIXES.AUTH_ACCOUNT);
export const generateVerificationId = () =>
  generateId(ID_PREFIXES.AUTH_VERIFICATION);
export const generateUserId = () => generateId(ID_PREFIXES.USER);
export const generateMediaFileId = () => generateId(ID_PREFIXES.MEDIA_FILE);
export const generateBatchId = () => generateId(ID_PREFIXES.BATCH);
