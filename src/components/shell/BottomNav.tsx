import type { ReactNode } from "react";
import { color } from "../../lib/theme";
import { useApp, type Screen } from "../../state/store";

const ITEMS: Array<{ key: Screen; icon: (stroke: string) => ReactNode }> = [
  {
    key: "today",
    icon: (s) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      </svg>
    ),
  },
  {
    key: "team",
    icon: (s) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 3l7 2.5v5c0 5-3.2 8-7 10-3.8-2-7-5-7-10v-5L12 3z" />
      </svg>
    ),
  },
  {
    key: "match",
    icon: (s) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    key: "sched",
    icon: (s) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    ),
  },
];

// Mobile-only sticky bottom tab bar that replaces the sidebar (≥44px targets).
export function BottomNav() {
  const { screen, go } = useApp();
  return (
    <nav
      className="tl-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(255,255,255,.94)",
        backdropFilter: "blur(8px)",
        borderTop: `1px solid ${color.hairline}`,
        justifyContent: "space-around",
        alignItems: "center",
        padding: "10px 0 max(14px, env(safe-area-inset-bottom))",
        zIndex: 45,
      }}
    >
      {ITEMS.map((it) => {
        const active = screen === it.key;
        return (
          <button
            key={it.key}
            onClick={() => go(it.key)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 16px", minWidth: 56, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label={it.key}
          >
            {it.icon(active ? color.accent : "#B5B9C0")}
          </button>
        );
      })}
    </nav>
  );
}
