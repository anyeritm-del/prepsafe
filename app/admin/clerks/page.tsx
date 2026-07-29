import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { deleteClerk } from "./actions";

const PAGE_SIZE = 20;

interface ClerksPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ClerksPage({ searchParams }: ClerksPageProps) {
  const { companyId } = await requireCompanySession();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [rows, total] = await Promise.all([
    prisma.clerk.findMany({
      where: { store: { companyId } },
      include: { store: true },
      orderBy: [{ order: "asc" }, { screenName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.clerk.count({ where: { store: { companyId } } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Clerks</h1>
        <Link
          href="/admin/clerks/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add new clerk
        </Link>
      </div>
      <AdminTable
        pageHref={(p) => `/admin/clerks?page=${p}`}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        rows={rows}
        columns={[
          { header: "Store", cell: (r) => r.store.name },
          { header: "Screen Name", cell: (r) => r.screenName },
          { header: "Print Name", cell: (r) => r.printName },
          {
            header: "Image",
            cell: (r) =>
              r.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
              ) : (
                ""
              ),
          },
          { header: "Order", cell: (r) => r.order },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex gap-2">
                <Link
                  href={`/admin/clerks/${r.id}/edit`}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteClerk.bind(null, r.id)}
                  confirmMessage={`Hapus clerk "${r.screenName}"?`}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
