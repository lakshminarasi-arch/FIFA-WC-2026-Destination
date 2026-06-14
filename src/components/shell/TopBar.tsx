import type { CSSProperties } from "react";
import type { Snapshot } from "../../types";
import { color, font, shadow } from "../../lib/theme";
import { useApp } from "../../state/store";
import { clock, TZ_OPTIONS, tzInfo } from "../../lib/time";
import { defaultMatch } from "../../lib/select";

function pageMeta(
  snapshot: Snapshot,
  screen: string,
  fav: string,
  selectedMatchId: string | null,
): { title: string; tag: string } {
  switch (screen) {
    case "team": {
      const name = snapshot.teams[fav]?.name?.toUpperCase() ?? "MY TEAM";
      return { title: "My Team", tag: name };
    }
    case "match": {
      const m = defaultMatch(snapshot, selectedMatchId);
      if (!m) return { title: "Match Center", tag: "SELECT A MATCH" };
      const status =
        m.status === "FINISHED"
          ? "FT"
          : m.status === "IN_PLAY" || m.status === "PAUSED"
            ? "LIVE"
            : "UPCOMING";
      return { title: "Match Center", tag: `${(m.group ?? "MATCH").toUpperCase()} · ${status}` };
    }
    case "sched":
      return { title: "Schedule", tag: "GROUP STAGE" };
    default: {
      const md = snapshot.competition.currentMatchday;
      return { title: "Today", tag: md ? `MATCHDAY ${md}` : "TOURNAMENT" };
    }
  }
}

export function TopBar({ snapshot }: { snapshot: Snapshot }) {
  const { screen, fav, tz, setTz, now, menu, setMenu, selectedMatchId } = useApp();
  const { title, tag } = pageMeta(snapshot, screen, fav, selectedMatchId);
  const zi = tzInfo(tz);

  const cell: CSSProperties = { padding: "7px 13px", textAlign: "left" };

  return (
    <header
      className="tl-topbar"
      style={{
        height: 68,
        flex: "none",
        borderBottom: `1px solid ${color.hairline}`,
        background: "rgba(255,255,255,.85)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: 21, margin: 0, letterSpacing: "-.01em" }}>{title}</h1>
        <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".1em", color: color.muted, border: `1px solid ${color.hairline}`, borderRadius: 999, padding: "4px 9px", whiteSpace: "nowrap" }}>{tag}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
        <button
          onClick={() => setMenu(menu === "tz" ? null : "tz")}
          style={{ display: "flex", alignItems: "center", background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 11, overflow: "hidden", cursor: "pointer", padding: 0 }}
        >
          <div style={{ ...cell, borderRight: `1px solid ${color.tileBorder}` }}>
            <div style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".1em", color: color.accent }}>YOUR TIME ▾</div>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 14, color: color.ink }}>
              {clock(now, tz)} <span style={{ color: color.muted, fontWeight: 500, fontSize: 11 }}>{zi.abbr}</span>
            </div>
          </div>
          <div className="tl-tz-cell-host" style={cell}>
            <div style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".1em", color: color.faint }}>HOST · ET</div>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 14, color: color.ink }}>
              {clock(now, "America/New_York")} <span style={{ color: color.muted, fontWeight: 500, fontSize: 11 }}>ET</span>
            </div>
          </div>
        </button>

        <div style={{ width: 38, height: 38, borderRadius: "50%", background: color.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 600, fontSize: 13 }}>YK</div>

        {menu === "tz" && (
          <>
            <div onClick={() => setMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
            <div style={{ position: "absolute", top: 52, right: 48, width: 234, background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 14, boxShadow: shadow.popover, padding: 7, zIndex: 40 }}>
              <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".12em", color: color.faint, padding: "7px 10px" }}>SHOW TIMES IN</div>
              {TZ_OPTIONS.map((z) => {
                const active = z.id === tz;
                return (
                  <button
                    key={z.id}
                    onClick={() => {
                      setTz(z.id);
                      setMenu(null);
                    }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 14px", border: "none", borderRadius: 9, background: active ? color.accentTint : "transparent", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ fontSize: 13, color: color.slate }}>{z.city}</span>
                    <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 600, color: active ? color.accent : color.ink }}>{z.abbr}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
