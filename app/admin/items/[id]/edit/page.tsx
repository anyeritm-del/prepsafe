import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/admin/ItemForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { updateItem } from "../../actions";

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { companyId } = await requireCompanySession();
  const { id } = await params;
  const [item, categories] = await Promise.all([
    prisma.item.findFirst({ where: { id, category: { companyId } } }),
    prisma.category.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Edit Item</h1>
      <ItemForm action={updateItem.bind(null, id)} categories={categories} defaultValues={item} submitLabel="Save" />
      <Link href="/admin/items" className="text-sm text-neutral-600 underline">
        Back to List
      </Link>
    </div>
  );
}
