import { PrintPageClient } from "@/components/PrintPageClient";
import type { PrintPageData } from "@/components/PrintLabelApp";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";

export default async function Home() {
  const { companyId } = await requireCompanySession();

  const [stores, clerks, categories, items] = await Promise.all([
    prisma.store.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.clerk.findMany({
      where: { store: { companyId } },
      orderBy: [{ order: "asc" }, { screenName: "asc" }],
    }),
    prisma.category.findMany({ where: { companyId }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.item.findMany({
      where: { active: true, category: { companyId } },
      orderBy: { buttonText: "asc" },
    }),
  ]);

  const data: PrintPageData = {
    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      labelMarginTopMm: s.labelMarginTopMm,
      labelMarginBottomMm: s.labelMarginBottomMm,
      labelMarginLeftMm: s.labelMarginLeftMm,
      labelMarginRightMm: s.labelMarginRightMm,
      labelNameMult: s.labelNameMult,
      labelRow1Mult: s.labelRow1Mult,
      labelRow2Mult: s.labelRow2Mult,
      labelClerkMult: s.labelClerkMult,
      labelStatusMult: s.labelStatusMult,
    })),
    clerks: clerks.map((c) => ({
      id: c.id,
      storeId: c.storeId,
      screenName: c.screenName,
      printName: c.printName,
      imageUrl: c.imageUrl,
      order: c.order,
    })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, order: c.order })),
    items: items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      buttonText: i.buttonText,
      labelText: i.labelText,
      shelfLifeHours: i.shelfLifeHours,
      todayPlusShelfLife: i.todayPlusShelfLife,
      defrostLifeHours: i.defrostLifeHours,
      directDefrostHours: i.directDefrostHours,
    })),
  };

  return <PrintPageClient data={data} />;
}
