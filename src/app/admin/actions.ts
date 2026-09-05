"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteListingAsAdmin(listingId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/listings");
  revalidatePath("/admin");
}

export async function setUserBanned(userId: string, banned: boolean, reason?: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ banned, banned_reason: banned ? (reason ?? null) : null })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function resolveReport(reportId: string, status: "RESOLVED" | "DISMISSED") {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("reports")
    .update({ status, resolved_by: admin.id, resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}
