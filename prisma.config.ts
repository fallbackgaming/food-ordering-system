import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Use session-mode URL for Prisma CLI (avoids PgBouncer transaction hangs)
    url: env("DIRECT_URL"),
  },
});
