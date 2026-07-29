import { notFound } from "next/navigation";
import { RegionForm } from "@/components/admin/RegionForm";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { updateRegion } from "../../actions";

interface EditRegionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRegionPage({ params }: EditRegionPageProps) {
  const { companyId } = await requireCompanySession();
  const { id } = await params;
  const region = await prisma.region.findFirst({ where: { id, companyId } });
  if (!region) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Edit region</h1>
      <RegionForm action={updateRegion.bind(null, id)} defaultValues={region} submitLabel="Save" />
    </div>
  );
}
