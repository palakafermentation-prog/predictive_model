/**
 * Development seed script
 *
 * Usage:
 *   pnpm db:seed
 *
 * To reset DB first, run manually:
 *   pnpm db:reset --force
 *   pnpm db:seed
 */

import "dotenv/config";

// Safety check: only run in development
if (process.env.NODE_ENV === "production") {
  console.error("ERROR: Seed script cannot run in production!");
  process.exit(1);
}

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const SEED_ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME;

if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || !SEED_ADMIN_FIRST_NAME) {
  console.error(
    "ERROR: Missing seed env vars. Ensure SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_FIRST_NAME are set in .env"
  );
  process.exit(1);
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  const { userCount, signup } = await import("../src/services/backend/auth.service");

  // Check if admin already exists
  const count = await userCount();
  if (count > 0) {
    console.log("⚠️  Database already has users. To re-seed, run:");
    console.log("   pnpm db:reset --force");
    console.log("   pnpm db:seed");
    process.exit(0);
  }

  // Create super admin
  console.log(`👤 Creating super admin: ${SEED_ADMIN_EMAIL}...`);
  await signup(SEED_ADMIN_EMAIL!, SEED_ADMIN_PASSWORD!, SEED_ADMIN_FIRST_NAME!);

  // Mark email as verified — bypass email flow in seed environment
  const { prisma } = await import("../src/lib/prisma");
  await prisma.authUser.update({
    where: { email: SEED_ADMIN_EMAIL! },
    data: { emailVerified: true },
  });

  console.log(`✅ Super admin created: ${SEED_ADMIN_EMAIL}\n`);

  console.log("🎉 Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Credentials:");
  console.log(`  Email:    ${SEED_ADMIN_EMAIL}`);
  console.log(`  Password: ${SEED_ADMIN_PASSWORD}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
