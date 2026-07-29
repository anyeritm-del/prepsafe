import Link from "next/link";
import { ReactNode } from "react";

interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  /** Builds the href for a given page number, including any active filters. */
  pageHref: (page: number) => string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  page,
  pageSize,
  total,
  pageHref,
}: AdminTableProps<T>) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = to < total;

  return (
    <div className="overflow-hidden rounded-md border border-neutral-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className="whitespace-nowrap px-3 py-2 font-medium text-neutral-600">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-neutral-100">
                {columns.map((col) => (
                  <td key={col.header} className="px-3 py-2 align-middle">
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-neutral-400">
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
        <span>{total === 0 ? "0 items" : `${from} - ${to} of ${total} items`}</span>
        <div className="flex gap-2">
          <Link
            href={pageHref(page - 1)}
            aria-disabled={!hasPrev}
            className={`rounded border border-neutral-300 px-2 py-1 ${
              hasPrev ? "hover:bg-neutral-100" : "pointer-events-none opacity-40"
            }`}
          >
            Prev
          </Link>
          <Link
            href={pageHref(page + 1)}
            aria-disabled={!hasNext}
            className={`rounded border border-neutral-300 px-2 py-1 ${
              hasNext ? "hover:bg-neutral-100" : "pointer-events-none opacity-40"
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
