import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations run against the direct (unpooled) connection; the app itself
  // connects with DATABASE_URL (pooled) via lib/prisma.ts. See README.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
