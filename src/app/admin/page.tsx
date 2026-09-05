import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [
    { count: users },
    { count: listings },
    { count: trades },
    { count: auctions },
    { count: activeAuctions },
    { count: openReports },
    { count: bids },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("type", "TRADE"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("type", "AUCTION"),
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("type", "AUCTION")
      .eq("status", "ACTIVE"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
    supabase.from("bids").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Live counts across LotClub.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Users" value={users ?? 0} href="/admin/users" />
        <StatCard label="Total listings" value={listings ?? 0} href="/admin/listings" />
        <StatCard label="Trade listings" value={trades ?? 0} href="/admin/listings" />
        <StatCard label="Auctions" value={auctions ?? 0} href="/admin/listings" />
        <StatCard label="Active auctions" value={activeAuctions ?? 0} href="/admin/listings" />
        <StatCard label="Total bids" value={bids ?? 0} />
        <StatCard label="Open reports" value={openReports ?? 0} href="/admin/reports" />
      </div>
    </div>
  );
}
