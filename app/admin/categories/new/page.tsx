import { CategoryForm } from "@/components/admin/CategoryForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { createCategory } from "../actions";

export default async function NewCategoryPage() {
  const { companyId } = await requireCompanySession();
  const regions = await prisma.region.findMany({ where: { companyId }, orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Add new category</h1>
      <CategoryForm action={createCategory} regions={regions} submitLabel="Create" />
    </div>
  );
}
