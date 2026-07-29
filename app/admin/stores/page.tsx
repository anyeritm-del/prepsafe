import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { deleteStore } from "./actions";

const PAGE_SIZE = 20;

interface StoresPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const { companyId } = await requireCompanySession();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [rows, total] = await Promise.all([
    prisma.store.findMany({
      where: { companyId },
      include: { region: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.store.count({ where: { companyId } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Stores</h1>
        <Link
          href="/admin/stores/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add new store
        </Link>
      </div>
      <AdminTable
        pageHref={(p) => `/admin/stores?page=${p}`}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        rows={rows}
        columns={[
          { header: "Name", cell: (r) => r.name },
          { header: "Region", cell: (r) => r.region?.name ?? "" },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex gap-2">
                <Link
                  href={`/admin/stores/${r.id}/edit`}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteStore.bind(null, r.id)}
                  confirmMessage={`Hapus store "${r.name}"?`}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
