import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { updateCompany } from "./actions";

export default async function CompanyPage() {
  const { companyId } = await requireCompanySession();
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Company</h1>
      <form action={updateCompany} className="flex max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700">Nama Company</span>
          <input
            type="text"
            name="name"
            defaultValue={company.name}
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Simpan
        </button>
      </form>
    </div>
  );
}
