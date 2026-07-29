import { ClerkForm } from "@/components/admin/ClerkForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { createClerk } from "../actions";

export default async function NewClerkPage() {
  const { companyId } = await requireCompanySession();
  const stores = await prisma.store.findMany({ where: { companyId }, orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Add new clerk</h1>
      <ClerkForm action={createClerk} stores={stores} submitLabel="Create" />
    </div>
  );
}
