import { notFound } from "next/navigation";
import { ClerkForm } from "@/components/admin/ClerkForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { updateClerk } from "../../actions";

interface EditClerkPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClerkPage({ params }: EditClerkPageProps) {
  const { companyId } = await requireCompanySession();
  const { id } = await params;
  const [clerk, stores] = await Promise.all([
    prisma.clerk.findFirst({ where: { id, store: { companyId } } }),
    prisma.store.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);
  if (!clerk) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Edit clerk</h1>
      <ClerkForm action={updateClerk.bind(null, id)} stores={stores} defaultValues={clerk} submitLabel="Save" />
    </div>
  );
}
