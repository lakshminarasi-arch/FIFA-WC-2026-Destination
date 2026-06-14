import type { CSSProperties, ReactNode } from "react";
import type { Team } from "../../types";
import { color, font } from "../../lib/theme";
import { useApp, type Screen } from "../../state/store";
import { Flag } from "../ui/Flag";

const NAV: Array<{ key: Screen; label: string; icon: ReactNode }> = [
  {
    key: "today",
    label: "Today",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      </svg>
    ),
  },
  {
    key: "team",
    label: "My Team",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 2.5v5c0 5-3.2 8-7 10-3.8-2-7-5-7-10v-5L12 3z" />
      </svg>
    ),
  },
  {
    key: "match",
    label: "Match Center",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    key: "sched",
    label: "Schedule",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    ),
  },
];

function navStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 11,
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: font.ui,
    fontWeight: active ? 600 : 500,
    fontSize: 14,
    background: active ? color.accentTint : "transparent",
    color: active ? color.accent : color.slate,
  };
}

const eyebrow: CSSProperties = {
  fontFamily: font.mono,
  fontSize: 9.5,
  letterSpacing: ".12em",
  color: color.faint,
  padding: "4px 8px 8px",
};

export function Sidebar({ teams }: { teams: Record<string, Team> }) {
  const { screen, go, fav, setMenu } = useApp();
  const favTeam = teams[fav];

  return (
    <aside
      className="tl-sidebar"
      style={{
        width: 248,
        flex: "none",
        background: color.surface,
        borderRight: `1px solid ${color.hairline}`,
        padding: "22px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 22px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2.5px solid ${color.accent}` }} />
        </div>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, letterSpacing: "-.01em" }}>TOUCHLINE</div>
          <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: ".14em", color: color.muted, marginTop: 3 }}>WC 2026 TRACKER</div>
        </div>
      </div>

      <div style={eyebrow}>MENU</div>

      {NAV.map((item) => (
        <button key={item.key} onClick={() => go(item.key)} style={navStyle(screen === item.key)}>
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}

      <div style={{ marginTop: "auto", paddingTop: 18 }}>
        <div
          onClick={() => setMenu("team")}
          style={{ border: `1px solid ${color.hairline}`, borderRadius: 14, padding: 13, cursor: "pointer", background: color.tile }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <span style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: ".12em", color: color.muted }}>MY TEAM</span>
            <span style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: ".06em", color: color.accent }}>CHANGE ▾</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Flag teams={teams} code={fav} width={26} height={18} />
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15 }}>{favTeam?.name ?? fav}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
