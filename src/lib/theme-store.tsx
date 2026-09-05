"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "hotwheels-market:theme:v1";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always starts as "dark" — matching the server-rendered default — so the
  // very first client render is identical to the SSR output. Any component
  // that renders different JSX based on `theme` (not just a CSS class) would
  // otherwise mismatch during hydration, since the real stored preference
  // is only knowable once we're running in the browser.
  const [theme, setThemeState] = useState<Theme>("dark");
  const isFirstCommit = useRef(true);

  // One-time correction, after hydration has already succeeded against the
  // "dark" default above.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") setThemeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    // The DOM class trick above is safe to reapply immediately (it's a
    // no-op if the inline script already set it correctly), but skip
    // persisting on this first pass — `theme` is still the stale "dark"
    // default here, one render before the correction effect above takes
    // effect, and writing it now would clobber a real stored "light" pref.
    if (isFirstCommit.current) {
      isFirstCommit.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore quota/availability errors
    }
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

// Runs synchronously during HTML parsing (before first paint) so the
// correct theme class is present on <html> before React ever hydrates —
// this is what actually prevents a full-page flash of the wrong theme.
// Content that reads `theme` via React state (like the icon above) still
// briefly shows the "dark" default until the correction effect runs, which
// is fine for a small settings-page icon/toggle.
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var isDark = stored ? stored === 'dark' : true;
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

// type flips to text/plain on the client so React doesn't try to treat this
// as a live script tag on re-renders/soft navigations; suppressHydrationWarning
// covers that expected server/client type mismatch.
export function ThemeInitScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
