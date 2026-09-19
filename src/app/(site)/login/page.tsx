"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-store";

function GoogleGIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.82-.07-1.62-.2-2.4H12v4.55h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.56-5.17 3.56-8.77Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3.02c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.12A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.6H1.27a12 12 0 0 0 0 10.79l4-3.12Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.6l4 3.13C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/profile";
  const { signInWithGoogle, googleBusy } = useAuth();
  const [agreed, setAgreed] = useState(false);

  function handleGoogle() {
    if (!agreed) return;
    void signInWithGoogle(next);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Image
            src="/logo-icon.png"
            alt="LotClub"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl"
            priority
          />
          <h1 className="text-xl font-extrabold text-zinc-50">Join LotClub</h1>
          <p className="text-sm text-zinc-400">Trade and bid with real collectors near you.</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
          <label className="mb-4 flex items-start gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
            />
            <span>
              I agree to LotClub&apos;s{" "}
              <Link href="/terms" target="_blank" className="font-semibold text-orange-400 hover:underline">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-orange-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            onClick={handleGoogle}
            disabled={googleBusy || !agreed}
            title={!agreed ? "Agree to the Terms & Conditions first" : undefined}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-700 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleGIcon />
            {googleBusy ? "Signing in..." : "Continue with Google"}
          </button>

          <ol className="mt-5 flex flex-col gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                1
              </span>
              Sign in with your Google account
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                2
              </span>
              Verify your WhatsApp number — it&apos;s how you and a trade partner arrange the
              handover, and it&apos;s only shared once a trade between you is accepted
            </li>
          </ol>
        </div>

        <p className="mt-2 text-center text-sm">
          <Link href="/" className="font-semibold text-zinc-400 hover:text-orange-400">
            Continue as guest →
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
