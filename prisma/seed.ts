import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ quiet: true });
config({ path: ".env.local", override: true, quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const SAMPLE_CATEGORIES = [
  {
    name: "Dry Items",
    order: 10,
    items: [
      { buttonText: "Beras", labelText: "Beras", shelfLifeHours: 720, todayPlusShelfLife: true },
      { buttonText: "Gula Pasir", labelText: "Gula Pasir", shelfLifeHours: 2160, todayPlusShelfLife: true },
    ],
  },
  {
    name: "Fruits & Veggie",
    order: 20,
    items: [
      { buttonText: "Tomat", labelText: "Tomat", shelfLifeHours: 72, todayPlusShelfLife: false },
      { buttonText: "Selada", labelText: "Selada", shelfLifeHours: 48, todayPlusShelfLife: false },
    ],
  },
  {
    name: "Meat",
    order: 30,
    items: [
      {
        buttonText: "Daging Sapi Giling",
        labelText: "Daging Sapi Giling",
        shelfLifeHours: 72,
        todayPlusShelfLife: false,
      },
      {
        buttonText: "Daging Sapi Fillet",
        labelText: "Daging Sapi Fillet",
        shelfLifeHours: 120,
        todayPlusShelfLife: false,
      },
    ],
  },
  {
    name: "Poultry",
    order: 40,
    items: [
      { buttonText: "Ayam Fillet", labelText: "Ayam Fillet", shelfLifeHours: 48, todayPlusShelfLife: false },
      { buttonText: "Ayam Utuh", labelText: "Ayam Utuh", shelfLifeHours: 72, todayPlusShelfLife: false },
    ],
  },
  {
    name: "Seafood",
    order: 50,
    items: [
      { buttonText: "Udang Kupas", labelText: "Udang Kupas", shelfLifeHours: 48, todayPlusShelfLife: false },
      {
        buttonText: "Ikan Kakap Fillet",
        labelText: "Ikan Kakap Fillet",
        shelfLifeHours: 72,
        todayPlusShelfLife: false,
      },
    ],
  },
];

const SAMPLE_CLERKS = [
  { screenName: "Andi", printName: "Andi", order: 1 },
  { screenName: "Budi", printName: "Budi", order: 2 },
  { screenName: "Citra", printName: "Citra", order: 3 },
];

async function ensureCompanyAdmin(): Promise<{ id: string }> {
  const adminEmail = requireEnv("SEED_ADMIN_EMAIL");

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { company: true },
  });
  if (existingUser?.company) {
    return existingUser.company;
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

  console.log(`Seed: created company "${companyName}" and admin user ${adminEmail}.`);
  return company;
}

async function ensureSampleCategories(companyId: string): Promise<void> {
  const existingCount = await prisma.category.count({ where: { companyId } });
  if (existingCount > 0) {
    console.log("Seed: categories already exist, skipping sample data.");
    return;
  }

  for (const category of SAMPLE_CATEGORIES) {
    const created = await prisma.category.create({
      data: { companyId, name: category.name, order: category.order },
    });
    await prisma.item.createMany({
      data: category.items.map((item) => ({ ...item, categoryId: created.id })),
    });
  }
  console.log(`Seed: created ${SAMPLE_CATEGORIES.length} sample categories with items.`);
}

async function ensureSampleClerks(companyId: string): Promise<void> {
  const store = await prisma.store.findFirst({ where: { companyId } });
  if (!store) return;

  const existingCount = await prisma.clerk.count({ where: { storeId: store.id } });
  if (existingCount > 0) {
    console.log("Seed: clerks already exist, skipping sample data.");
    return;
  }

  await prisma.clerk.createMany({
    data: SAMPLE_CLERKS.map((clerk) => ({ ...clerk, storeId: store.id })),
  });
  console.log(`Seed: created ${SAMPLE_CLERKS.length} sample clerks.`);
}

async function main() {
  const company = await ensureCompanyAdmin();
  await ensureSampleCategories(company.id);
  await ensureSampleClerks(company.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
