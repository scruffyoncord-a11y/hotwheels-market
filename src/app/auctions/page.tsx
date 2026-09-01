"use client";

import { Suspense } from "react";
import { BrowseListings } from "@/components/BrowseListings";

export default function AuctionsPage() {
  return (
    <Suspense>
      <BrowseListings
        type="AUCTION"
        subheading="bid against other collectors, highest offer wins"
      />
    </Suspense>
  );
}
