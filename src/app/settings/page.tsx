"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-store";
import { useListings } from "@/lib/listings-store";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, lookupPincode } from "@/lib/avatar";
import { claimUsername, isValidUsername } from "@/lib/profile";
import { useMyProfile } from "@/lib/use-my-profile";
import { Avatar } from "@/components/Avatar";
import {
  CameraIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  ShareIcon,
} from "@/components/icons";

function MenuRow({
  icon,
  label,
  onClick,
  href,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  trailing?: React.ReactNode;
}) {
  const content = (
    <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4 last:border-b-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-orange-400">
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold text-zinc-100">{label}</span>
      {trailing ?? <ChevronRightIcon className="h-4 w-4 text-zinc-600" />}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block transition hover:bg-zinc-900/60">
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left transition hover:bg-zinc-900/60">
        {content}
      </button>
    );
  }
  // No row-level action (e.g. a custom trailing control like a toggle owns
  // its own click) — render as a plain div so we never nest interactive
  // elements inside a <button>.
  return <div>{content}</div>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-orange-600" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          checked ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function EditProfileView({ onBack }: { onBack: () => void }) {
  const { user, updateProfile, signInWithPhone } = useAuth();
  const { profile, setProfile } = useMyProfile();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl ?? null);
  const [pincode, setPincode] = useState(user.pincode ?? "");
  const [locationLabel, setLocationLabel] = useState(user.city ?? "");
  const [lookingUp, setLookingUp] = useState(false);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [editingPhone, setEditingPhone] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Seed the username field once the profile finishes loading (it starts
  // null while the fetch is in flight).
  useEffect(() => {
    if (profile?.username) setUsername(profile.username);
  }, [profile?.username]);

  function sendOtp() {
    if (!/^\d{10}$/.test(phone.trim())) return;
    setOtpSent(true);
  }

  function verifyOtp() {
    if (!/^\d{6}$/.test(otp.trim())) return;
    signInWithPhone(phone.trim());
    setEditingPhone(false);
    setOtpSent(false);
    setOtp("");
  }

  function handleAvatarPick(file: File) {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handlePincodeChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 6);
    setPincode(digits);
    if (digits.length !== 6) {
      setLocationLabel("");
      return;
    }
    setLookingUp(true);
    const result = await lookupPincode(digits);
    setLookingUp(false);
    if (result.city) setLocationLabel(`${result.city}, ${result.state}`);
  }

  async function save() {
    setSaving(true);
    setError("");

    if (user.id && username.trim() && username.trim() !== profile?.username) {
      if (!isValidUsername(username.trim())) {
        setSaving(false);
        setError("Username must be 3-20 characters: lowercase letters, numbers, underscores.");
        return;
      }
      const usernameResult = await claimUsername(supabase, user.id, username.trim());
      if (usernameResult.error) {
        setSaving(false);
        setError(usernameResult.error);
        return;
      }
      setProfile({
        id: user.id,
        username: username.trim(),
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        city: profile?.city ?? null,
        collectionPublic: profile?.collectionPublic ?? false,
      });
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

    const city = locationLabel.split(",")[0]?.trim() || user.city;
    await updateProfile({
      displayName: displayName.trim() || "You",
      avatarUrl,
      pincode: pincode || undefined,
      city,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm font-semibold text-zinc-400 hover:text-orange-400"
      >
        ← Back to settings
      </button>
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
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-700 bg-zinc-800 text-zinc-500 transition hover:border-orange-500 hover:text-orange-400"
          >
            {avatarPreview ? (
              <Image src={avatarPreview} alt="" fill unoptimized className="object-cover" />
            ) : (
              <CameraIcon className="h-6 w-6" />
            )}
          </button>
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
          {profile?.username && (
            <span className="text-xs text-zinc-500">
              Your public profile: /u/{profile.username}
            </span>
          )}
        </label>

        <label className="mt-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-300">Pincode</span>
          <input
            value={pincode}
            onChange={(e) => void handlePincodeChange(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 682001"
            className="input tracking-widest"
          />
          {lookingUp && <span className="text-xs text-zinc-500">Looking up…</span>}
          {locationLabel && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <CheckIcon className="h-3.5 w-3.5" /> {locationLabel}
            </span>
          )}
        </label>

        <label className="mt-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-300">Phone Number</span>
          {!editingPhone ? (
            <div className="flex gap-2">
              <div className="input flex-1 text-zinc-400">
                {user.phone ? `+91 ${user.phone}` : "Not linked yet"}
              </div>
              <button
                type="button"
                onClick={() => setEditingPhone(true)}
                className="shrink-0 rounded-xl border border-zinc-700 px-3 text-sm font-semibold text-zinc-300 transition hover:border-orange-500"
              >
                Update
              </button>
            </div>
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
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={sendOtp}
                className="self-start rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700"
              >
                Send OTP
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" /> OTP sent to +91 {phone}
              </p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                className="input tracking-[0.3em]"
                autoFocus
              />
              <button
                type="button"
                onClick={verifyOtp}
                className="self-start rounded-full bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700"
              >
                Verify
              </button>
            </div>
          )}
          <span className="text-xs text-zinc-500">
            Use the update button to change your phone number with OTP verification.
          </span>
        </label>

        {error && <p className="mt-4 text-xs text-rose-400">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-sm font-bold text-white transition hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? (
            "Saving…"
          ) : saved ? (
            <>
              <CheckIcon className="h-4 w-4" /> Saved
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAwayMode, signOut } = useAuth();
  const { listings, updateListing } = useListings();
  const [view, setView] = useState<"menu" | "profile">("menu");

  const myActiveAuctions = listings.filter(
    (l) => !!user.id && l.sellerId === user.id && l.type === "AUCTION" && l.status === "ACTIVE",
  );

  function toggleAway(away: boolean) {
    setAwayMode(away);
    myActiveAuctions.forEach((l) => updateListing(l.id, { biddingPaused: away }));
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <main className="flex-1">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 pb-10 pt-8 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <Link href="/profile" className="mb-4 inline-block text-sm text-zinc-400 hover:text-orange-400">
            ← Back to profile
          </Link>
          <h1 className="text-2xl font-extrabold text-zinc-50">Account Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage your profile information and preferences</p>
        </div>
      </div>

      <div className="-mt-6 rounded-t-3xl bg-zinc-950 px-4 pb-10 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {view === "profile" ? (
            <EditProfileView onBack={() => setView("menu")} />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <Avatar name={user.displayName} url={user.avatarUrl} size={48} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-50">{user.displayName}</p>
                  <p className="text-xs text-zinc-500">
                    {isAuthenticated
                      ? user.email ?? (user.phone ? `+91 ${user.phone}` : "Signed in")
                      : "Not signed in — using guest session"}
                  </p>
                </div>
                {!isAuthenticated && (
                  <Link
                    href="/login"
                    className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-700"
                  >
                    Sign in
                  </Link>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                <MenuRow icon={<ShareIcon className="h-4 w-4" />} label="Edit Profile" onClick={() => setView("profile")} />
                <MenuRow icon={<HeartIcon className="h-4 w-4" />} label="Wishlist" href="/wishlist" />
                <MenuRow
                  icon={<ClockIcon className="h-4 w-4" />}
                  label="Away Mode"
                  trailing={<Toggle checked={!!user.awayMode} onChange={toggleAway} />}
                />
              </div>
              {user.awayMode && (
                <p className="-mt-3 text-xs text-amber-400">
                  Away Mode is on — bidding is paused on your active auctions until you turn it off.
                </p>
              )}

              {isAuthenticated && (
                <button
                  onClick={handleSignOut}
                  className="rounded-full border border-rose-800 px-5 py-3 text-center text-sm font-bold text-rose-400 transition hover:bg-rose-950"
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
