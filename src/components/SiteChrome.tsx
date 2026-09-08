"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// The admin panel (served at admin.lotclub.in, rewritten to /admin by
// proxy.ts) has its own header/nav — the main marketplace chrome
// shouldn't wrap it too.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
