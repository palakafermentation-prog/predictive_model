// Removed this check for the manual deployment process.
// Once CI/CD is implemented, we may need to change this.
// if (process.env.NODE_ENV !== "production") {
  require("dotenv/config");
// }

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
