import type { SupabaseClient } from "@supabase/supabase-js";

export const REPORT_REASONS = [
  "Scam or fraud",
  "Fake or misleading listing",
  "Inappropriate content",
  "Harassment",
  "Other",
] as const;

export async function fileReport(
  supabase: SupabaseClient,
  reporterId: string,
  targetType: "listing" | "user",
  targetId: string,
  reason: string,
  details?: string,
) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details || null,
  });
  if (error) throw new Error(error.message);
}
