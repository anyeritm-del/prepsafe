import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Match Next.js's own env precedence: .env, then .env.local overriding it
// (the file `vercel env pull` writes to).
config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations run against the direct (unpooled) connection; the app itself
  // connects with DATABASE_URL (pooled) via lib/prisma.ts. Vercel's Postgres
  // (Neon) integration sets both of these automatically. See README.
  datasource: {
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
