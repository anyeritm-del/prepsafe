import Link from "next/link";
import { ReactNode } from "react";
import { auth, signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/admin/company", label: "Company" },
  { href: "/admin/regions", label: "Regions" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/items", label: "Items" },
  { href: "/admin/clerks", label: "Clerks" },
];

async function logoutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-green-800 px-4 py-3 text-white">
        <Link href="/admin" className="font-semibold">
          Administration
        </Link>
        <nav className="flex flex-1 flex-wrap gap-4 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
          <Link href="/" className="hover:underline">
            Cetak Label
          </Link>
        </nav>
        <span className="text-sm text-green-100">{session?.user.email}</span>
        <form action={logoutAction}>
          <button type="submit" className="text-sm hover:underline">
            Log off
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
