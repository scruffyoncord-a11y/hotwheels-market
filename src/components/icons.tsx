interface IconProps {
  className?: string;
}

const base = "1.8";

export function HeartIcon({ className = "h-4 w-4", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={base}>
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2.1 0 3.6 1.2 4.8 2.8.4.5 1 .5 1.4 0C13.4 5.2 14.9 4 17 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarIcon({ className = "h-4 w-4", filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={base}>
      <path d="M12 3.5l2.6 5.6 6 .7-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6-4.4-4.2 6-.7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MoonIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function SunIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.3M12 19.2v2.3M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.4 19.6 6 18M18 6l1.6-1.6" />
    </svg>
  );
}

export function LockIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function LinkIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 6.5 12.5 5a3.5 3.5 0 0 1 5 5L16 11.5" />
      <path d="M13 17.5 11.5 19a3.5 3.5 0 0 1-5-5L8 12.5" />
    </svg>
  );
}

export function HammerIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 5.5 18.5 9.5" />
      <path d="M4 20l6.5-6.5" />
      <path d="M12.5 7.5 16 4l4.5 4.5-3.5 3.5-2-2-4.5 4.5-3-3Z" />
    </svg>
  );
}

export function CarIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13l1.8-5.4A2 2 0 0 1 6.7 6.2h10.6a2 2 0 0 1 1.9 1.4L21 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H6.5v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
      <circle cx="7.5" cy="17.5" r="1.4" />
      <circle cx="16.5" cy="17.5" r="1.4" />
    </svg>
  );
}

export function MessageIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  );
}

export function FlameIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1.2-.7-2-1.2-2.8 1.8.6 3.2 2.6 3.2 5a5 5 0 0 1-10 0c0-4.5 3.5-6 5-10.2Z" />
    </svg>
  );
}

export function EyeIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function CameraIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

export function SwapIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h14M14 4l4 4-4 4" />
      <path d="M20 16H6M10 12l-4 4 4 4" />
    </svg>
  );
}

export function PauseIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 9.5 17 19 6.5" />
    </svg>
  );
}

export function XIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function TrashIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ShareIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export function TrophyIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" />
      <path d="M12 13v3M9 20h6M10 16.5h4v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2Z" />
    </svg>
  );
}

export function ZapIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function SparkleIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
    </svg>
  );
}

export function HandshakeIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M11.87505 20.5004c0.08335 0 0.1792 -0.02085 0.2875 -0.0625 0.10835 -0.0417 0.19585 -0.09585 0.2625 -0.1625l8.425 -8.45c0.2167 -0.2167 0.3792 -0.4625 0.4875 -0.7375 0.10835 -0.275 0.1625 -0.5542 0.1625 -0.8375 0 -0.28335 -0.05415 -0.5667 -0.1625 -0.85 -0.1083 -0.28335 -0.2708 -0.53335 -0.4875 -0.75l-4.5 -4.50001c-0.21665 -0.216665 -0.46665 -0.379165 -0.75 -0.4875 -0.2833 -0.108335 -0.56665 -0.1625 -0.85 -0.1625 -0.2833 0 -0.5625 0.054165 -0.8375 0.1625 -0.275 0.108335 -0.5208 0.270835 -0.7375 0.4875l-0.45 0.45 2.025 2.05001c0.2167 0.2333 0.40835 0.50415 0.575 0.8125 0.1667 0.3083 0.25 0.6458 0.25 1.0125 0 0.6333 -0.2458 1.19165 -0.7375 1.675 -0.49165 0.4833 -1.05415 0.725 -1.6875 0.725 -0.41665 0 -0.7625 -0.0625 -1.0375 -0.1875 -0.275 -0.125 -0.52915 -0.3042 -0.7625 -0.5375l-1.825 -1.825 -4.525 4.525c-0.08332 0.0833 -0.14165 0.1708 -0.174985 0.2625 -0.033335 0.09165 -0.05 0.1875 -0.05 0.2875 0 0.21665 0.070835 0.3958 0.2125 0.5375 0.141685 0.14165 0.320835 0.2125 0.537485 0.2125 0.1 0 0.19585 -0.025 0.2875 -0.075 0.0917 -0.05 0.17085 -0.10835 0.2375 -0.175l2.925 -2.925c0.15 -0.15 0.325 -0.225 0.525 -0.225s0.375 0.075 0.525 0.225c0.15 0.15 0.225 0.325 0.225 0.525s-0.075 0.375 -0.225 0.525l-2.9 2.9c-0.0833 0.0833 -0.14165 0.175 -0.175 0.275 -0.0333 0.1 -0.05 0.2 -0.05 0.3 0 0.2 0.075 0.375 0.225 0.525 0.15 0.15 0.325 0.225 0.525 0.225 0.1 0 0.19585 -0.02085 0.2875 -0.0625 0.0917 -0.0417 0.17085 -0.09585 0.2375 -0.1625l2.925 -2.925c0.15 -0.15 0.325 -0.225 0.525 -0.225s0.375 0.075 0.525 0.225c0.15 0.15 0.225 0.325 0.225 0.525s-0.075 0.375 -0.225 0.525l-2.9 2.9c-0.06665 0.06665 -0.1208 0.15415 -0.1625 0.2625 -0.04165 0.1083 -0.0625 0.2125 -0.0625 0.3125 0 0.2 0.075 0.375 0.225 0.525 0.15 0.15 0.325 0.225 0.525 0.225 0.1 0 0.1917 -0.0167 0.275 -0.05 0.08335 -0.03335 0.1667 -0.0917 0.25 -0.175l2.925 -2.925c0.15 -0.15 0.325 -0.225 0.525 -0.225s0.375 0.075 0.525 0.225c0.15 0.15 0.225 0.325 0.225 0.525s-0.075 0.375 -0.225 0.525l-2.925 2.925c-0.0833 0.0833 -0.14165 0.175 -0.175 0.275 -0.0333 0.1 -0.05 0.19165 -0.05 0.275 0 0.2333 0.0667 0.41665 0.2 0.55 0.13335 0.1333 0.3167 0.2 0.55 0.2Zm0 1.5c-0.55 0 -1.04165 -0.2042 -1.475 -0.6125 -0.4333 -0.40835 -0.69165 -0.9125 -0.775 -1.5125 -0.56665 -0.08335 -1.04165 -0.3167 -1.425 -0.7 -0.3833 -0.38335 -0.61665 -0.85835 -0.7 -1.425 -0.56665 -0.08335 -1.0375 -0.32085 -1.4125 -0.7125 -0.375 -0.3917 -0.60415 -0.8625 -0.6875 -1.4125 -0.61665 -0.08335 -1.124985 -0.33335 -1.524985 -0.75 -0.4 -0.4167 -0.6 -0.9167 -0.6 -1.5 0 -0.28335 0.054165 -0.5667 0.1625 -0.85 0.108335 -0.28335 0.270835 -0.53335 0.4875 -0.75l4.549985 -4.55c0.28335 -0.28335 0.63335 -0.425 1.05 -0.425 0.4167 0 0.7667 0.14165 1.05 0.425l1.7 1.7c0.13335 0.1333 0.2792 0.2375 0.4375 0.3125 0.15835 0.075 0.3125 0.1125 0.4625 0.1125 0.2167 0 0.42085 -0.09585 0.6125 -0.2875 0.1917 -0.1917 0.2875 -0.39585 0.2875 -0.6125 0 -0.1 -0.02915 -0.2125 -0.0875 -0.3375 -0.0583 -0.125 -0.15415 -0.2542 -0.2875 -0.3875l-3.575 -3.57501c-0.21665 -0.216665 -0.46665 -0.379165 -0.75 -0.4875 -0.2833 -0.108335 -0.56665 -0.1625 -0.85 -0.1625 -0.2833 0 -0.5625 0.054165 -0.8375 0.1625 -0.275 0.108335 -0.5208 0.270835 -0.7375 0.4875L3.150065 7.9504c-0.333335 0.3333 -0.5375 0.7375 -0.6125 1.2125 -0.075 0.475 -0.020835 0.92915 0.1625 1.3625 0.083335 0.1833 0.083335 0.3708 0 0.5625 -0.083335 0.19165 -0.216665 0.32915 -0.4 0.4125 -0.183335 0.0833 -0.375 0.0833 -0.575 0 -0.2 -0.08335 -0.341665 -0.2167 -0.425 -0.4 -0.283335 -0.75 -0.366665 -1.49585 -0.25 -2.2375 0.116665 -0.7417 0.466665 -1.4042 1.05 -1.9875l3.774985 -3.77501c0.3667 -0.366665 0.78335 -0.6375 1.25 -0.8125 0.4667 -0.175 0.9417 -0.2625 1.425 -0.2625 0.48335 0 0.9542 0.0875 1.4125 0.2625 0.45835 0.175 0.87085 0.445835 1.2375 0.8125l0.45 0.45 0.45 -0.45c0.3667 -0.366665 0.78335 -0.6375 1.25 -0.8125 0.4667 -0.175 0.9417 -0.2625 1.425 -0.2625 0.48335 0 0.9542 0.0875 1.4125 0.2625 0.45835 0.175 0.87085 0.445835 1.2375 0.8125l4.475 4.47501c0.3667 0.36665 0.6417 0.7833 0.825 1.25 0.18335 0.46665 0.275 0.94165 0.275 1.425 0 0.4833 -0.09165 0.95415 -0.275 1.4125 -0.1833 0.4583 -0.4583 0.8708 -0.825 1.2375l-8.425 8.425c-0.21665 0.21665 -0.4625 0.3833 -0.7375 0.5 -0.275 0.11665 -0.5625 0.175 -0.8625 0.175Z" />
    </svg>
  );
}

export function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ClockIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function DotIcon({ className = "h-2 w-2" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export function FlagIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4.5c0-.3.2-.5.5-.7 2-1 5-1 7 .3 2 1.3 5 1.3 7 .3.3-.1.5.1.5.4v9c0 .3-.2.5-.5.7-2 1-5 1-7-.3-2-1.3-5-1.3-7-.3" />
    </svg>
  );
}

export function ShieldIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 5 6v5.5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-2.5Z" />
      <path d="m9 12 2 2 4-4.5" />
    </svg>
  );
}

export function UsersIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c0-3.2 2.5-5.5 5.5-5.5s5.5 2.3 5.5 5.5" />
      <path d="M15.2 5.3a3.2 3.2 0 0 1 0 6" />
      <path d="M17.5 14.3c2.4.5 3.9 2.4 4 5.2" />
    </svg>
  );
}
