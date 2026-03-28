import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined. Check your .env file.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma: PrismaClient = isBuildPhase
  ? ({} as PrismaClient)
  : (globalForPrisma.prisma ?? createPrismaClient());

if (process.env.NODE_ENV !== "production" && !isBuildPhase) globalForPrisma.prisma = prisma;
