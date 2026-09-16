"use client";

import { useState } from "react";
import Link from "next/link";
import { useNotifications, type AppNotification } from "@/lib/notifications-store";
import { timeAgo } from "@/lib/format";
import { BellIcon, CheckIcon, HammerIcon, HandshakeIcon, XIcon } from "./icons";

const TYPE_ICON: Record<AppNotification["type"], React.ReactNode> = {
  proposal_received: <HandshakeIcon className="h-4 w-4" />,
  proposal_accepted: <CheckIcon className="h-4 w-4" />,
  proposal_declined: <XIcon className="h-4 w-4" />,
  trade_completed: <CheckIcon className="h-4 w-4" />,
  trade_failed: <XIcon className="h-4 w-4" />,
  outbid: <HammerIcon className="h-4 w-4" />,
  auction_won: <HammerIcon className="h-4 w-4" />,
  auction_live: <HammerIcon className="h-4 w-4" />,
  more_items_requested: <HandshakeIcon className="h-4 w-4" />,
  more_items_added: <HandshakeIcon className="h-4 w-4" />,
  more_items_declined: <XIcon className="h-4 w-4" />,
};

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-orange-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-orange-400"
        title="Notifications"
      >
        <BellIcon className="h-4.5 w-4.5" filled={unreadCount > 0} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-xl bg-orange-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-orange-600 hover:underline dark:text-orange-400"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-zinc-400">
                  Nothing yet — trade and auction alerts will show up here.
                </p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "#"}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex gap-3 border-b border-zinc-100 px-4 py-3 text-left transition last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60 ${
                      n.read ? "" : "bg-orange-50/60 dark:bg-orange-950/20"
                    }`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {TYPE_ICON[n.type]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {n.title}
                        </span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[11px] text-zinc-400 dark:text-zinc-500">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
