import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteListingAsAdmin } from "../actions";

interface ListingRow {
  id: string;
  type: string;
  title: string;
  status: string;
  seller_name: string;
  seller_city: string;
  price_inr: number | null;
  starting_bid_inr: number | null;
  created_at: string;
}

export default async function AdminListingsPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("listings")
    .select("id, type, title, status, seller_name, seller_city, price_inr, starting_bid_inr, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const listings = (data ?? []) as ListingRow[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Listings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Most recent {listings.length} listings. Removing one deletes it (and its bids) permanently.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Seller</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {listings.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{l.title}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{l.type}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{l.status}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {l.seller_name} · {l.seller_city}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {l.price_inr ?? l.starting_bid_inr ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteListingAsAdmin.bind(null, l.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  No listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
