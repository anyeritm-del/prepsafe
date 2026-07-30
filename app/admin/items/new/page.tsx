import Link from "next/link";
import { ItemForm } from "@/components/admin/ItemForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { createItem } from "../actions";

export default async function NewItemPage() {
  const { companyId } = await requireCompanySession();
  const categories = await prisma.category.findMany({ where: { companyId }, orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Create Item</h1>
      <ItemForm action={createItem} categories={categories} submitLabel="Create" />
      <Link href="/admin/items" className="text-sm text-neutral-600 underline">
        Back to List
      </Link>
    </div>
  );
}
