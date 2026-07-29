import { RegionForm } from "@/components/admin/RegionForm";
import { createRegion } from "../actions";

export default function NewRegionPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Add new region</h1>
      <RegionForm action={createRegion} submitLabel="Create" />
    </div>
  );
}
