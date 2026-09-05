import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { ShieldIcon } from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-50">
            <ShieldIcon className="h-5 w-5 text-orange-600" />
            LotClub Admin
          </div>
          <nav className="flex flex-1 items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</span>
          <Link
            href="https://lotclub.in"
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-orange-400 hover:text-orange-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            ← Back to site
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
