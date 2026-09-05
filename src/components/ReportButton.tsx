"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { createClient } from "@/lib/supabase/client";
import { fileReport, REPORT_REASONS } from "@/lib/reports";
import { FlagIcon } from "@/components/icons";

export function ReportButton({
  targetType,
  targetId,
  className = "",
}: {
  targetType: "listing" | "user";
  targetId: string;
  className?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!user.id) return;
    setBusy(true);
    try {
      await fileReport(createClient(), user.id, targetType, targetId, reason, details.trim());
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 ${className}`}
      >
        <FlagIcon className="h-3 w-3" />
        Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-2 text-center">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Reported — thanks.
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Our team will take a look.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
                >
                  Close
                </button>
              </div>
            ) : !isAuthenticated || !user.id ? (
              <div className="py-2 text-center">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Sign in to report {targetType === "listing" ? "this listing" : "this user"}.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Report {targetType === "listing" ? "this listing" : "this user"}
                </p>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input mt-3 w-full"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Any extra detail (optional)"
                  rows={3}
                  className="input mt-2 w-full resize-none"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy ? "Reporting…" : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
