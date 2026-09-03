"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-store";
import { CheckIcon } from "@/components/icons";

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

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithPhone, googleBusy } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [error, setError] = useState("");

  function handleGoogle() {
    void signInWithGoogle();
  }

  function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSent(true);
  }

  function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code.");
      return;
    }
    setOtpBusy(true);
    setTimeout(() => {
      signInWithPhone(phone.trim());
      router.push("/profile");
    }, 500);
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
          <h1 className="text-xl font-extrabold text-zinc-50">Sign in to LotClub</h1>
          <p className="text-sm text-zinc-400">Trade and bid with collectors near you.</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
          <button
            onClick={handleGoogle}
            disabled={googleBusy}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-zinc-700 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60"
          >
            <GoogleGIcon />
            {googleBusy ? "Signing in..." : "Continue with Google"}
          </button>

          <div className="my-4 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-zinc-600">
            <span className="h-px flex-1 bg-zinc-800" />
            or
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          {!otpSent ? (
            <form onSubmit={sendOtp} className="flex flex-col gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-300">Mobile number</span>
                <div className="flex gap-2">
                  <span className="input flex items-center justify-center px-3">+91</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    inputMode="numeric"
                    placeholder="9876543210"
                    className="input flex-1"
                  />
                </div>
              </label>
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                type="submit"
                className="mt-1 rounded-full bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" /> OTP sent to +91 {phone}
              </p>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-300">Enter 6-digit code</span>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="123456"
                  className="input tracking-[0.3em]"
                  autoFocus
                />
              </label>
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={otpBusy}
                className="mt-1 rounded-full bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
              >
                {otpBusy ? "Verifying..." : "Verify & Sign In"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-300"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-zinc-600">
          Phone sign-in is demo mode — no real SMS is sent yet. Any 6-digit code works.
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/" className="font-semibold text-zinc-400 hover:text-orange-400">
            Continue as guest →
          </Link>
        </p>
      </div>
    </main>
  );
}
