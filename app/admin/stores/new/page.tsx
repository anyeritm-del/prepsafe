import { StoreForm } from "@/components/admin/StoreForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { createStore } from "../actions";

export default async function NewStorePage() {
  const { companyId } = await requireCompanySession();
  const regions = await prisma.region.findMany({ where: { companyId }, orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Add new store</h1>
      <StoreForm action={createStore} regions={regions} submitLabel="Create" />
    </div>
  );
}
