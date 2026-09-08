"use client";

import { Suspense } from "react";
import { BrowseListings } from "@/components/BrowseListings";

export default function Home() {
  return (
    <Suspense>
      <BrowseListings
        type="TRADE"
        subheading="swap cars with other collectors, no cash needed"
      />
    </Suspense>
  );
}
