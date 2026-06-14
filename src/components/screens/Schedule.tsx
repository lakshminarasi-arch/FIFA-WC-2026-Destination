import type { Match, Snapshot } from "../../types";
import { color, font, shadow } from "../../lib/theme";
import { useApp } from "../../state/store";
import { dayKey, dayLabel, fmt, tzInfo } from "../../lib/time";
import { involvesTeam, isLive, scheduleByDay } from "../../lib/select";
import { Flag } from "../ui/Flag";

export function Schedule({ snapshot }: { snapshot: Snapshot }) {
  const { fav, tz, now, openMatch } = useApp();
  const zi = tzInfo(tz);
  const days = scheduleByDay(snapshot, tz);
  const todayKey = dayKey(now, tz);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: color.accentTint, border: `1px solid ${color.accentTintBorder}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.accent} strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 13, color: "#1F3BA8" }}>
          Every kickoff is shown in <strong>your local time ({zi.abbr})</strong>. The venue and its local time appear when our data source provides them.
        </span>
      </div>

      {days.length === 0 && (
        <div style={{ background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 18, padding: 40, textAlign: "center", color: color.muted, fontSize: 14 }}>
          No fixtures scheduled yet. The full match calendar will appear here once it's published.
        </div>
      )}

      {days.map((d) => {
        const label = dayLabel(d.matches[0].utcDate, tz);
        const prefix = d.key === todayKey ? "TODAY · " : "";
        return (
          <div key={d.key} style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".14em", color: color.muted, marginBottom: 12 }}>{prefix}{label}</div>
            <div style={{ background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 18, overflow: "hidden", boxShadow: shadow.card }}>
              {d.matches.map((m) => (
                <ScheduleRow key={m.id} snapshot={snapshot} match={m} fav={fav} tz={tz} zi={zi} onOpen={openMatch} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScheduleRow({
  snapshot,
  match,
  fav,
  tz,
  zi,
  onOpen,
}: {
  snapshot: Snapshot;
  match: Match;
  fav: string;
  tz: string;
  zi: { abbr: string };
  onOpen: (id: string) => void;
}) {
  const isFav = involvesTeam(match, fav);
  const live = isLive(match);
  const yt = fmt(match.utcDate, tz);
  const vt = match.venueZone ? fmt(match.utcDate, match.venueZone) : null;

  return (
    <div
      onClick={() => onOpen(match.id)}
      style={{ display: "flex", alignItems: "center", gap: 18, padding: "17px 20px", borderTop: `1px solid ${color.rowDivider}`, cursor: "pointer", borderLeft: `3px solid ${isFav ? color.accent : "transparent"}` }}
    >
      <div style={{ width: 104, flex: "none", borderRight: `1px solid ${color.rowDivider}`, paddingRight: 16 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: live ? color.negative : color.ink }}>{live ? "LIVE" : yt.time}</div>
        <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".06em", color: color.faint, marginTop: 2 }}>{live && match.minute ? `${match.minute}' · 2nd half` : `${yt.date} · ${zi.abbr}`}</div>
        {vt && <div style={{ fontSize: 12, color: color.slate, marginTop: 7 }}>{vt.time} <span style={{ color: color.faint, fontSize: 10 }}>{match.venueAbbr ?? ""}</span></div>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {[match.home, match.away].map((t, i) => (
          <div key={t.code} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: i === 0 ? 8 : 0 }}>
            <Flag teams={snapshot.teams} code={t.code} width={24} height={16} radius={2.5} />
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>{t.name}</span>
          </div>
        ))}
      </div>

      <div className="tl-sched-meta" style={{ width: 280, flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          {match.group && <span style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".08em", color: color.muted, background: "#F4F4F0", borderRadius: 5, padding: "3px 7px" }}>{match.group}</span>}
          {isFav && <span style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".08em", color: color.accent, background: color.accentTint, borderRadius: 5, padding: "3px 7px" }}>MY TEAM</span>}
        </div>
        {match.venue && <div style={{ fontSize: 12, color: color.slate, marginBottom: 8 }}>{match.venue}</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {match.channels.map((c) => (
            <span key={c} style={{ fontFamily: font.mono, fontSize: 9, color: color.darkFaint, border: `1px solid ${color.hairline}`, borderRadius: 5, padding: "2px 7px" }}>{c}</span>
          ))}
        </div>
      </div>

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.disabledScore} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
        <path d="M9 6l6 6-6 6" />
      </svg>
    </div>
  );
}
