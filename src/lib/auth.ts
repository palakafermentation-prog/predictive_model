import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, bearer } from "better-auth/plugins";
import { prisma } from "./prisma";
import { BETTER_AUTH_URL, BETTER_AUTH_SECRET, IS_PRODUCTION } from "./env";
import { sendResetPasswordEmail, sendVerificationEmail } from "./email";
import {
  generateAuthUserId,
  generateSessionId,
  generateAccountId,
  generateVerificationId,
} from "@pferm/shared-lib";

const SESSION_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days
const SESSION_UPDATE_AGE = 60 * 60 * 24; // 1 day

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    modelName: "AuthUser",
  },
  session: {
    modelName: "AuthSession",
    expiresIn: SESSION_EXPIRES_IN,
    updateAge: SESSION_UPDATE_AGE,
    cookieCache: {
      enabled: false,
    },
  },
  account: {
    modelName: "AuthAccount",
  },
  verification: {
    modelName: "AuthVerification",
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, id: generateAuthUserId() },
        }),
      },
    },
    session: {
      create: {
        before: async (session) => ({
          data: { ...session, id: generateSessionId() },
        }),
      },
    },
    account: {
      create: {
        before: async (account) => ({
          data: { ...account, id: generateAccountId() },
        }),
      },
    },
    verification: {
      create: {
        before: async (verification) => ({
          data: { ...verification, id: generateVerificationId() },
        }),
      },
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get("token") || "";
      const verificationUrl = `${urlObj.origin}/verify-email?token=${token}`;
      await sendVerificationEmail(user.email, verificationUrl);
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[Auth] sendResetPassword callback invoked for user="${user.email}" url="${url}"`);
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/");
      const token = pathSegments[pathSegments.length - 1];
      const callbackPath = urlObj.searchParams.get("callbackURL") || "/reset-password";
      const resetUrl = `${urlObj.origin}${callbackPath}?token=${token}`;
      console.log(`[Auth] Reset URL constructed: "${resetUrl}"`);
      await sendResetPasswordEmail(user.email, resetUrl);
    },
  },

  advanced: {
    useSecureCookies: IS_PRODUCTION,
    cookiePrefix: "pferm-auth",
  },

  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,

  plugins: [
    admin(),
    bearer(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
