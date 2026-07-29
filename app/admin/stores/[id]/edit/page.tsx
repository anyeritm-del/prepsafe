import { notFound } from "next/navigation";
import { StoreForm } from "@/components/admin/StoreForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { updateStore } from "../../actions";

interface EditStorePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStorePage({ params }: EditStorePageProps) {
  const { companyId } = await requireCompanySession();
  const { id } = await params;
  const [store, regions] = await Promise.all([
    prisma.store.findFirst({ where: { id, companyId } }),
    prisma.region.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);
  if (!store) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Edit store</h1>
      <StoreForm action={updateStore.bind(null, id)} regions={regions} defaultValues={store} submitLabel="Save" />
    </div>
  );
}
