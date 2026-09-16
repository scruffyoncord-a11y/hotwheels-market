"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";

export type NotificationType =
  | "proposal_received"
  | "proposal_accepted"
  | "proposal_declined"
  | "trade_completed"
  | "trade_failed"
  | "outbid"
  | "auction_won"
  | "auction_live"
  | "more_items_requested"
  | "more_items_added"
  | "more_items_declined";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

function rowToNotification(r: NotificationRow): AppNotification {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    link: r.link,
    read: r.read,
    createdAt: r.created_at,
  };
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setNotifications((data as NotificationRow[]).map(rowToNotification));
        setLoading(false);
      });

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const next = rowToNotification(payload.new as NotificationRow);
          setNotifications((prev) => (prev.some((n) => n.id === next.id) ? prev : [next, ...prev]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const next = rowToNotification(payload.new as NotificationRow);
          setNotifications((prev) => prev.map((n) => (n.id === next.id ? next : n)));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      loading,
      markRead: (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        void supabase.from("notifications").update({ read: true }).eq("id", id);
      },
      markAllRead: () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length === 0) return;
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        void supabase.from("notifications").update({ read: true }).in("id", unreadIds);
      },
    }),
    [notifications, loading, supabase],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
}
