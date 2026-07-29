import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { prisma } from "@/lib/prisma";
import { requireCompanySession } from "@/lib/session";
import { deleteItem } from "./actions";
import { Prisma } from "@/lib/generated/prisma/client";

const PAGE_SIZE = 20;

interface ItemsPageProps {
  searchParams: Promise<{ page?: string; regionId?: string; storeId?: string; categoryId?: string }>;
}

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const { companyId } = await requireCompanySession();
  const { page: pageParam, regionId, storeId, categoryId } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [regions, stores, categories] = await Promise.all([
    prisma.region.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.store.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ]);

  let categoryFilter: Prisma.CategoryWhereInput = { companyId };
  if (categoryId) {
    categoryFilter = { companyId, id: categoryId };
  } else if (storeId) {
    const store = stores.find((s) => s.id === storeId);
    categoryFilter = { companyId, OR: [{ regionId: store?.regionId ?? null }, { regionId: null }] };
  } else if (regionId) {
    categoryFilter = { companyId, OR: [{ regionId }, { regionId: null }] };
  }

  const itemWhere: Prisma.ItemWhereInput = { category: categoryFilter };

  const [rows, total] = await Promise.all([
    prisma.item.findMany({
      where: itemWhere,
      include: { category: true },
      orderBy: { buttonText: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.item.count({ where: itemWhere }),
  ]);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (regionId) params.set("regionId", regionId);
    if (storeId) params.set("storeId", storeId);
    if (categoryId) params.set("categoryId", categoryId);
    params.set("page", String(p));
    return `/admin/items?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Items</h1>
        <Link
          href="/admin/items/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add new item
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-neutral-600">Region</span>
          <select name="regionId" defaultValue={regionId ?? ""} className="rounded-md border border-neutral-300 px-2 py-1.5">
            <option value="">- ALL Regions -</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-neutral-600">Store</span>
          <select name="storeId" defaultValue={storeId ?? ""} className="rounded-md border border-neutral-300 px-2 py-1.5">
            <option value="">- ALL Stores -</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-neutral-600">Category</span>
          <select name="categoryId" defaultValue={categoryId ?? ""} className="rounded-md border border-neutral-300 px-2 py-1.5">
            <option value="">- ALL Categories -</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100">
          Filter
        </button>
      </form>

      <AdminTable
        pageHref={pageHref}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        rows={rows}
        columns={[
          { header: "Button Text", cell: (r) => r.buttonText },
          { header: "Label Text", cell: (r) => r.labelText },
          { header: "Category", cell: (r) => r.category.name },
          { header: "Shelf Life", cell: (r) => r.shelfLifeHours },
          { header: "Active", cell: (r) => (r.active ? "Yes" : "No") },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex gap-2">
                <Link
                  href={`/admin/items/${r.id}/edit`}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100"
                >
                  Edit
                </Link>
                <DeleteButton
                  action={deleteItem.bind(null, r.id)}
                  confirmMessage={`Hapus item "${r.buttonText}"?`}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
