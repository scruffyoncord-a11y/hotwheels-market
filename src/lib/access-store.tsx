"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AccessGrant, AccessRequest } from "./types";

const REQUESTS_KEY = "hotwheels-market:access-requests:v1";
const GRANTS_KEY = "hotwheels-market:access-grants:v1";

interface AccessContextValue {
  requests: AccessRequest[];
  grants: AccessGrant[];
  requestAccess: (listingId: string, requesterName: string) => void;
  respondToRequest: (requestId: string, approve: boolean) => void;
  grantViaToken: (listingId: string, viewerName: string) => void;
  hasAccess: (listingId: string, viewerName: string) => boolean;
  requestsForListing: (listingId: string) => AccessRequest[];
  myRequest: (listingId: string, requesterName: string) => AccessRequest | undefined;
}

const AccessContext = createContext<AccessContextValue | null>(null);

function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // localStorage unavailable or corrupt — fall back to initial
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota/availability errors
    }
  }, [key, state, loaded]);

  return [state, setState] as const;
}

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = usePersistedState<AccessRequest[]>(REQUESTS_KEY, []);
  const [grants, setGrants] = usePersistedState<AccessGrant[]>(GRANTS_KEY, []);

  const value = useMemo<AccessContextValue>(
    () => ({
      requests,
      grants,
      requestAccess: (listingId, requesterName) => {
        setRequests((prev) => {
          const existing = prev.find(
            (r) => r.listingId === listingId && r.requesterName === requesterName,
          );
          if (existing) return prev;
          return [
            ...prev,
            {
              id: `req-${Date.now()}`,
              listingId,
              requesterName,
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
          ];
        });
      },
      respondToRequest: (requestId, approve) => {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: approve ? "APPROVED" : "DENIED" } : r)),
        );
        if (approve) {
          const req = requests.find((r) => r.id === requestId);
          if (req) {
            setGrants((prev) =>
              prev.some((g) => g.listingId === req.listingId && g.viewerName === req.requesterName)
                ? prev
                : [...prev, { listingId: req.listingId, viewerName: req.requesterName, grantedAt: new Date().toISOString() }],
            );
          }
        }
      },
      grantViaToken: (listingId, viewerName) => {
        setGrants((prev) =>
          prev.some((g) => g.listingId === listingId && g.viewerName === viewerName)
            ? prev
            : [...prev, { listingId, viewerName, grantedAt: new Date().toISOString() }],
        );
      },
      hasAccess: (listingId, viewerName) =>
        grants.some((g) => g.listingId === listingId && g.viewerName === viewerName),
      requestsForListing: (listingId) =>
        requests
          .filter((r) => r.listingId === listingId)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      myRequest: (listingId, requesterName) =>
        requests.find((r) => r.listingId === listingId && r.requesterName === requesterName),
    }),
    [requests, grants, setRequests, setGrants],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within an AccessProvider");
  return ctx;
}
