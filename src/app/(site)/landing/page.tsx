"use client";

import { useRouter } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";

export default function LandingRoute() {
  const router = useRouter();
  return <LandingPage onContinue={() => router.push("/")} />;
}
