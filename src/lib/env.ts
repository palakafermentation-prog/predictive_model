/**
 * Environment variables with validation
 * Validates on module load, then exports typed constants
 */

const isServer = typeof window === "undefined";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function required(name: string): string {
  const value = process.env[name];
  if (!value && !isBuildPhase) throw new Error(`Missing required environment variable: ${name}`);
  return value ?? "";
}

// Client-side environment variables
const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!NEXT_PUBLIC_API_BASE_URL && !isBuildPhase) throw new Error("Missing required environment variable: NEXT_PUBLIC_API_BASE_URL");

// Server-side environment variables
let DATABASE_URL: string | undefined;
let BETTER_AUTH_URL: string | undefined;
let BETTER_AUTH_SECRET: string | undefined;
let NODE_ENV: string | undefined;
let SEED_ADMIN_EMAIL: string | undefined;
let SEED_ADMIN_PASSWORD: string | undefined;
let SEED_ADMIN_FIRST_NAME: string | undefined;
let SMTP_HOST: string | undefined;
let SMTP_PORT: string | undefined;
let SMTP_USERNAME: string | undefined;
let SMTP_PASSWORD: string | undefined;
let EMAIL_FROM: string | undefined;
let FILE_UPLOADS_PATH: string | undefined;
let MEDIA_MAX_FILE_SIZE: string | undefined;
let MEDIA_MAX_WIDTH: string | undefined;
let MEDIA_MAX_HEIGHT: string | undefined;
let MEDIA_QUALITY: string | undefined;
let MEDIA_CACHE_MAX_AGE: string | undefined;
let AI_SERVICE_URL: string | undefined;

if (isServer) {
  DATABASE_URL = required("DATABASE_URL");
  BETTER_AUTH_URL = required("BETTER_AUTH_URL");
  BETTER_AUTH_SECRET = required("BETTER_AUTH_SECRET");
  SMTP_HOST = required("SMTP_HOST");
  SMTP_PORT = required("SMTP_PORT");
  SMTP_USERNAME = required("SMTP_USERNAME");
  SMTP_PASSWORD = required("SMTP_PASSWORD");
  EMAIL_FROM = required("EMAIL_FROM");
  FILE_UPLOADS_PATH = required("FILE_UPLOADS_PATH");
  MEDIA_MAX_FILE_SIZE = required("MEDIA_MAX_FILE_SIZE");
  MEDIA_MAX_WIDTH = required("MEDIA_MAX_WIDTH");
  MEDIA_MAX_HEIGHT = required("MEDIA_MAX_HEIGHT");
  MEDIA_QUALITY = required("MEDIA_QUALITY");
  MEDIA_CACHE_MAX_AGE = required("MEDIA_CACHE_MAX_AGE");

  AI_SERVICE_URL = process.env.AI_SERVICE_URL;

  NODE_ENV = process.env.NODE_ENV;

  // Seed configuration (required in development only)
  if (NODE_ENV === "development") {
    SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
    SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
    SEED_ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME;
  }
}

export {
  NEXT_PUBLIC_API_BASE_URL,
  DATABASE_URL,
  BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
  NODE_ENV,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_FIRST_NAME,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  EMAIL_FROM,
  FILE_UPLOADS_PATH,
  AI_SERVICE_URL,
};

export const IS_PRODUCTION = NODE_ENV === "production";
export const IS_DEVELOPMENT = NODE_ENV === "development";

// Media configuration as parsed numbers (server-side only)
export const MEDIA_MAX_FILE_SIZE_BYTES = isServer && MEDIA_MAX_FILE_SIZE ? parseInt(MEDIA_MAX_FILE_SIZE, 10) : 0;
export const MEDIA_MAX_WIDTH_PX = isServer && MEDIA_MAX_WIDTH ? parseInt(MEDIA_MAX_WIDTH, 10) : 0;
export const MEDIA_MAX_HEIGHT_PX = isServer && MEDIA_MAX_HEIGHT ? parseInt(MEDIA_MAX_HEIGHT, 10) : 0;
export const MEDIA_QUALITY_PERCENT = isServer && MEDIA_QUALITY ? parseInt(MEDIA_QUALITY, 10) : 0;
export const MEDIA_CACHE_MAX_AGE_SECONDS = isServer && MEDIA_CACHE_MAX_AGE ? parseInt(MEDIA_CACHE_MAX_AGE, 10) : 0;
