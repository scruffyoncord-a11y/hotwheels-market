"use client";

import { Suspense, useEffect, useState } from "react";
import { BrowseListings } from "@/components/BrowseListings";
import { LandingPage } from "@/components/LandingPage";

const VISITED_KEY = "hotwheels-market:visited:v1";

function HomeContent() {
  // Always starts true, matching what the server renders (it has no way
  // to know visit history) — avoids the same class of hydration mismatch
  // fixed for the theme toggle in theme-store.tsx. Corrected right after
  // mount for returning visitors, which can cause a brief flash of the
  // landing page for THEM only — never for a genuinely new visitor.
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(VISITED_KEY)) setShowLanding(false);
    } catch {
      // localStorage unavailable — just show the landing page every time
    }
  }, []);

  function continueToApp() {
    try {
      window.localStorage.setItem(VISITED_KEY, "1");
    } catch {
      // ignore quota/availability errors
    }
    setShowLanding(false);
  }

  if (showLanding) return <LandingPage onContinue={continueToApp} />;

  return (
    <BrowseListings type="TRADE" subheading="swap cars with other collectors, no cash needed" />
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
