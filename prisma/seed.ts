import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main() {
  const adminEmail = requireEnv("SEED_ADMIN_EMAIL");

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Seed skipped: user ${adminEmail} already exists.`);
    return;
  }

  const companyName = requireEnv("SEED_COMPANY_NAME");
  const storeName = requireEnv("SEED_STORE_NAME");
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");

  const company = await prisma.company.create({ data: { name: companyName } });
  await prisma.store.create({ data: { companyId: company.id, name: storeName } });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: UserRole.COMPANY_ADMIN,
      companyId: company.id,
    },
  });

  console.log(`Seed complete: company "${companyName}", admin user ${adminEmail}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
