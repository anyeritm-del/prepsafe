import Link from "next/link";

const MODULES = [
  { href: "/admin/company", label: "Company", description: "Nama company Anda" },
  { href: "/admin/regions", label: "Regions", description: "Pengelompokan Store (opsional)" },
  { href: "/admin/stores", label: "Stores", description: "Outlet/dapur tempat Clerk bertugas" },
  { href: "/admin/categories", label: "Categories", description: "Kategori menu/item" },
  { href: "/admin/items", label: "Items", description: "Daftar item beserta masa simpan" },
  { href: "/admin/clerks", label: "Clerks", description: "Staf yang tampil di layar cetak" },
];

export default function AdminHome() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-neutral-900">Data Master</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
          >
            <p className="font-medium text-neutral-900">{mod.label}</p>
            <p className="text-sm text-neutral-500">{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
