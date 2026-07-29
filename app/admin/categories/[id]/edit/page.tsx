import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { updateCategory } from "../../actions";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { companyId } = await requireCompanySession();
  const { id } = await params;
  const [category, regions] = await Promise.all([
    prisma.category.findFirst({ where: { id, companyId } }),
    prisma.region.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);
  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Edit category</h1>
      <CategoryForm
        action={updateCategory.bind(null, id)}
        regions={regions}
        defaultValues={category}
        submitLabel="Save"
      />
    </div>
  );
}
