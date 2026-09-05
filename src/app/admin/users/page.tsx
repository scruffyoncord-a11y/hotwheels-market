import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { setUserBanned } from "../actions";

interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  city: string | null;
  collection_public: boolean;
  banned: boolean;
  created_at: string;
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, city, collection_public, banned, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const users = (data ?? []) as ProfileRow[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Users</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Most recent {users.length} accounts. Banning blocks nothing in the app yet by itself —
          use it to flag an account while you follow up.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Username</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">Collection</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {u.display_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {u.username ? `@${u.username}` : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{u.city ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {u.collection_public ? "Public" : "Private"}
                </td>
                <td className="px-4 py-3">
                  {u.banned ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">
                      Banned
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={setUserBanned.bind(null, u.id, !u.banned, "Banned by admin")}>
                    <button
                      type="submit"
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        u.banned
                          ? "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          : "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                      }`}
                    >
                      {u.banned ? "Unban" : "Ban"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  No accounts with a profile yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
