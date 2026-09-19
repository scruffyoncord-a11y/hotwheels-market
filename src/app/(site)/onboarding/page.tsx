"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-store";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, lookupPincode } from "@/lib/avatar";
import { claimUsername, isValidUsername } from "@/lib/profile";
import { CameraIcon, CheckIcon } from "@/components/icons";

function suggestUsername(displayName: string): string {
  const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return base.slice(0, 16) || "collector";
}

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/profile";
  const { user, isAuthenticated, updateProfile, linkPhone } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(() => suggestUsername(user.displayName));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl ?? null);
  const [pincode, setPincode] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const phoneVerified = !!user.phone;

  async function sendOtp() {
    setPhoneError("");
    if (!/^\d{10}$/.test(phone.trim())) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${phone.trim()}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error ?? "Couldn't send the code.");
        return;
      }
      setOtpSent(true);
    } catch {
      setPhoneError("Couldn't send the code — try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function verifyOtp() {
    setPhoneError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setPhoneError("Enter the 6-digit code.");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${phone.trim()}`, code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPhoneError(data.error ?? "Couldn't verify that code.");
        return;
      }
      const result = await linkPhone(phone.trim());
      if (result.error) {
        setPhoneError(result.error);
        return;
      }
      setOtp("");
      setOtpSent(false);
    } catch {
      setPhoneError("Couldn't verify that code — try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function handlePincodeChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 6);
    setPincode(digits);
    setLocationLabel("");
    setError("");
    if (digits.length !== 6) return;
    setLookingUp(true);
    const result = await lookupPincode(digits);
    setLookingUp(false);
    if (result.city) {
      setLocationLabel(`${result.city}, ${result.state}`);
    } else if (result.error) {
      setError(result.error);
    }
  }

  function handleAvatarPick(file: File) {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleContinue() {
    if (!isValidUsername(username)) {
      setError("Username must be 3-20 characters: lowercase letters, numbers, underscores.");
      return;
    }
    if (pincode.length !== 6) {
      setError("Enter your 6-digit pincode.");
      return;
    }
    if (!phoneVerified) {
      setError("Verify your WhatsApp number to continue.");
      return;
    }
    setSaving(true);
    setError("");

    if (user.id) {
      const usernameResult = await claimUsername(supabase, user.id, username);
      if (usernameResult.error) {
        setSaving(false);
        setError(usernameResult.error);
        return;
      }
    }

    let avatarUrl = user.avatarUrl;
    if (avatarFile && user.id) {
      const result = await uploadAvatar(supabase, user.id, avatarFile);
      if (result.error) {
        setSaving(false);
        setError(result.error);
        return;
      }
      avatarUrl = result.url;
    }

    const city = locationLabel.split(",")[0]?.trim() || undefined;
    await updateProfile({
      displayName: displayName.trim() || user.displayName,
      pincode,
      city,
      avatarUrl,
    });

    router.push(next);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-extrabold text-zinc-50">Welcome to LotClub</h1>
          <p className="mt-1 text-sm text-zinc-400">
            A few quick things before you start trading — including a verified WhatsApp number (we text a code to check it).
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-5 flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarPick(file);
                e.target.value = "";
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarPick(file);
                e.target.value = "";
              }}
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-700 bg-zinc-800 text-zinc-500 transition hover:border-orange-500 hover:text-orange-400"
              >
                {avatarPreview ? (
                  // unoptimized: avatarPreview is a blob: URL right after picking a
                  // file, which Next's server-side image optimizer can't fetch.
                  <Image src={avatarPreview} alt="" fill unoptimized className="object-cover" />
                ) : (
                  <CameraIcon className="h-6 w-6" />
                )}
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                title="Use camera"
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm hover:bg-orange-700"
              >
                <CameraIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-orange-400 hover:underline"
            >
              {avatarPreview ? "Change photo" : "Add a profile photo"}
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-300">Display Name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-300">Username</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-zinc-500">@</span>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))
                }
                placeholder="collector123"
                className="input flex-1"
              />
            </div>
            <span className="text-xs text-zinc-500">
              How others find and mention you — letters, numbers, underscores.
            </span>
          </label>

          <label className="mt-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-300">Pincode</span>
            <input
              value={pincode}
              onChange={(e) => void handlePincodeChange(e.target.value)}
              inputMode="numeric"
              placeholder="e.g. 682001"
              className="input tracking-widest"
              autoFocus
            />
            <span className="text-xs text-zinc-500">
              Used to show your city to other collectors — no full address needed.
            </span>
            {lookingUp && <span className="text-xs text-zinc-500">Looking up…</span>}
            {locationLabel && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" /> {locationLabel}
              </span>
            )}
          </label>

          <div className="mt-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-300">WhatsApp number</span>
            {phoneVerified ? (
              <p className="flex items-center gap-1.5 rounded-xl border border-emerald-800/60 bg-emerald-950/20 px-3 py-2 text-sm font-medium text-emerald-400">
                <CheckIcon className="h-4 w-4" /> +91 {user.phone} — verified
              </p>
            ) : !otpSent ? (
              <div className="flex flex-col gap-2">
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
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={otpBusy}
                  className="self-start rounded-xl bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-60"
                >
                  {otpBusy ? "Sending…" : "Send code by SMS"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckIcon className="h-3.5 w-3.5" /> Code sent to +91 {phone}
                </p>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="123456"
                  className="input tracking-[0.3em]"
                  autoFocus
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otpBusy}
                    className="rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
                  >
                    {otpBusy ? "Verifying…" : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setPhoneError("");
                    }}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-300"
                  >
                    Use a different number
                  </button>
                </div>
              </div>
            )}
            {phoneError && <p className="text-xs text-rose-400">{phoneError}</p>}
            <span className="text-xs text-zinc-500">
              Required to trade. Only shared with someone once a trade between you is accepted.
            </span>
          </div>

          {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}

          <button
            onClick={handleContinue}
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
