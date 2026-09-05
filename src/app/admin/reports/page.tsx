import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveReport } from "../actions";

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: "listing" | "user";
  target_id: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  created_at: string;
}

export default async function AdminReportsPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, details, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const reports = (data ?? []) as ReportRow[];

  const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
  const listingIds = [...new Set(reports.filter((r) => r.target_type === "listing").map((r) => r.target_id))];
  const userIds = [...new Set(reports.filter((r) => r.target_type === "user").map((r) => r.target_id))];

  const [{ data: reporters }, { data: listings }, { data: targetUsers }] = await Promise.all([
    reporterIds.length
      ? supabase.from("profiles").select("id, display_name, username").in("id", reporterIds)
      : Promise.resolve({ data: [] }),
    listingIds.length
      ? supabase.from("listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from("profiles").select("id, display_name, username").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map(
    [...(reporters ?? []), ...(targetUsers ?? [])].map((p) => [
      p.id as string,
      (p.display_name as string | null) ?? (p.username ? `@${p.username}` : "Unknown"),
    ]),
  );
  const listingById = new Map((listings ?? []).map((l) => [l.id as string, l.title as string]));

  function targetLabel(r: ReportRow) {
    if (r.target_type === "listing") return listingById.get(r.target_id) ?? "Deleted listing";
    return profileById.get(r.target_id) ?? "Deleted user";
  }

  const open = reports.filter((r) => r.status === "OPEN");
  const closed = reports.filter((r) => r.status !== "OPEN");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Reports</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {open.length} open · {closed.length} resolved or dismissed.
        </p>
      </div>

      <div className="space-y-3">
        {open.length === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No open reports. Nice.
          </p>
        )}
        {open.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {r.target_type === "listing" ? "Listing" : "User"}: {targetLabel(r)}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Reported by {profileById.get(r.reporter_id) ?? "Unknown"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-semibold">{r.reason}</span>
                  {r.details ? ` — ${r.details}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={resolveReport.bind(null, r.id, "RESOLVED")}>
                  <button
                    type="submit"
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    Mark resolved
                  </button>
                </form>
                <form action={resolveReport.bind(null, r.id, "DISMISSED")}>
                  <button
                    type="submit"
                    className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Dismiss
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      {closed.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            History
          </h2>
          <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {closed.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{targetLabel(r)}</span>
                  <span className="ml-2 text-zinc-500 dark:text-zinc-400">{r.reason}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.status === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
