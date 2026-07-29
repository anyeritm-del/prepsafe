import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { deleteCategory } from "./actions";

const PAGE_SIZE = 20;

interface CategoriesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const { companyId } = await requireCompanySession();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      where: { companyId },
      include: { region: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.category.count({ where: { companyId } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Category</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add new category
        </Link>
      </div>
      <AdminTable
        pageHref={(p) => `/admin/categories?page=${p}`}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        rows={rows}
        columns={[
          { header: "Region", cell: (r) => r.region?.name ?? "" },
          { header: "Name", cell: (r) => r.name },
          { header: "Order", cell: (r) => r.order },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex gap-2">
                <Link
                  href={`/admin/categories/${r.id}/edit`}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/items?categoryId=${r.id}`}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100"
                >
                  Items
                </Link>
                <DeleteButton
                  action={deleteCategory.bind(null, r.id)}
                  confirmMessage={`Hapus category "${r.name}"? Semua item di dalamnya ikut terhapus.`}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
