import type { CSSProperties } from "react";
import type { Match, Snapshot } from "../../types";
import { color, font, shadow } from "../../lib/theme";
import { useApp } from "../../state/store";
import { fmt, daysTo, tzInfo } from "../../lib/time";
import {
  favGroup,
  favNextMatch,
  isFinished,
  isLive,
  lastFinishedMatch,
  liveMatch,
  nextUpcomingMatch,
  rankedNews,
  todayMatches,
} from "../../lib/select";
import { Flag } from "../ui/Flag";
import { relativeTime } from "../../lib/time";

const card: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.hairline}`,
  borderRadius: 18,
  boxShadow: shadow.card,
};

export function Today({ snapshot }: { snapshot: Snapshot }) {
  const { fav, tz, now, openMatch, go } = useApp();
  const zi = tzInfo(tz);
  const live = liveMatch(snapshot);
  const next = favNextMatch(snapshot, fav, now);
  const group = favGroup(snapshot, fav);
  const fixtures = todayMatches(snapshot, tz, now);
  const news = rankedNews(snapshot, fav, 4);
  // Feature card: a live match if any, otherwise the genuinely next match to
  // kick off (not just the day's earliest fixture), else the latest result.
  const featured = live ?? nextUpcomingMatch(snapshot, now) ?? lastFinishedMatch(snapshot) ?? fixtures[0];

  return (
    <div>
      <div className="tl-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Live / next feature card */}
        <FeatureCard snapshot={snapshot} match={featured} onOpen={openMatch} />

        {/* Your team · next up */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: ".12em", color: color.muted, marginBottom: 14 }}>YOUR TEAM · NEXT UP</div>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
            <Flag teams={snapshot.teams} code={fav} width={42} height={30} radius={4} />
            <div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18 }}>{snapshot.teams[fav]?.name ?? fav}</div>
              <div style={{ fontSize: 12.5, color: color.slate }}>{groupPosLabel(snapshot, fav)}</div>
            </div>
          </div>
          {next ? (
            <div style={{ borderTop: `1px dashed ${color.hairline}`, paddingTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: color.slate }}>{next.home.code === fav ? "vs" : "@"}</span>
                  <Flag teams={snapshot.teams} code={opponent(next, fav)} width={30} height={21} />
                  <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15 }}>{snapshot.teams[opponent(next, fav)]?.name ?? opponent(next, fav)}</span>
                </div>
                <span style={{ fontFamily: font.mono, fontSize: 10, color: color.muted }}>{daysTo(next.utcDate, now)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Tile label="YOUR TIME" value={`${fmt(next.utcDate, tz).full} ${zi.abbr}`} />
                {next.venueZone && <Tile label="VENUE TIME" value={`${fmt(next.utcDate, next.venueZone).full} ${next.venueAbbr ?? ""}`} />}
              </div>
              {next.venue && <div style={{ fontSize: 12, color: color.muted, marginTop: 11 }}>{next.venue}</div>}
            </div>
          ) : (
            <div style={{ borderTop: `1px dashed ${color.hairline}`, paddingTop: 16, fontSize: 13, color: color.muted }}>No upcoming fixture scheduled yet.</div>
          )}
          <button onClick={() => go("team")} style={{ marginTop: 16, width: "100%", background: color.surface, color: color.ink, border: `1px solid ${color.hairline}`, borderRadius: 10, padding: 10, fontFamily: font.ui, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>View team journey</button>
        </div>
      </div>

      <div className="tl-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginTop: 20 }}>
        {/* Today's matches */}
        <div style={{ ...card, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17 }}>Today's matches</div>
            <button onClick={() => go("sched")} style={{ background: "none", border: "none", color: color.accent, fontFamily: font.ui, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Full schedule →</button>
          </div>
          {fixtures.length === 0 && <div style={{ padding: "20px 6px", fontSize: 13, color: color.muted }}>No matches today — check the full schedule for upcoming fixtures.</div>}
          {fixtures.map((m) => (
            <FixtureRow key={m.id} snapshot={snapshot} match={m} onOpen={openMatch} />
          ))}
        </div>

        {/* Side rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15 }}>{group?.name ?? "Group"}</div>
              <span style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".1em", color: color.faint }}>P W D L PTS</span>
            </div>
            {group ? (
              group.rows.map((r) => {
                const isFav = r.teamCode === fav;
                return (
                  <div key={r.teamCode} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 0", borderTop: `1px solid ${color.rowDivider}` }}>
                    <span style={{ width: 14, fontFamily: font.mono, fontSize: 11, color: color.faint }}>{r.rank}</span>
                    <Flag teams={snapshot.teams} code={r.teamCode} width={22} height={15} radius={2} />
                    <span style={{ fontWeight: isFav ? 700 : 500, fontSize: 13.5, color: isFav ? color.accent : color.ink }}>{snapshot.teams[r.teamCode]?.name ?? r.teamCode}</span>
                    <span style={{ marginLeft: "auto", fontFamily: font.mono, fontSize: 11.5, color: color.muted }}>{`${r.played} ${r.won} ${r.draw} ${r.lost}`}</span>
                    <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13.5, width: 22, textAlign: "right" }}>{r.points}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "12px 0", fontSize: 13, color: color.muted }}>Group standings not available yet.</div>
            )}
          </div>

          <div style={{ ...card, padding: 20 }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Latest</div>
            {news.length === 0 && <div style={{ padding: "12px 0", fontSize: 13, color: color.muted }}>No headlines yet.</div>}
            {news.map((n) => (
              <a key={n.id} href={n.link} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "13px 0", borderTop: `1px solid ${color.rowDivider}`, textDecoration: "none", color: "inherit" }}>
                <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".08em", color: n.teams.includes(fav) ? color.accent : color.muted, marginBottom: 6 }}>{n.source.toUpperCase()} · {relativeTime(n.publishedAt, now)}</div>
                <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.35 }}>{n.title}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: color.tile, border: `1px solid ${color.tileBorder}`, borderRadius: 9, padding: "9px 10px" }}>
      <div style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".08em", color: color.faint }}>{label}</div>
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 14 }}>{value}</div>
    </div>
  );
}

function FeatureCard({ snapshot, match, onOpen }: { snapshot: Snapshot; match: Match | undefined; onOpen: (id: string) => void }) {
  const { tz } = useApp();
  if (!match) {
    return (
      <div style={{ background: color.ink, borderRadius: 18, padding: 24, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
        <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: ".1em", color: color.darkMuted }}>NO MATCHES SCHEDULED</span>
      </div>
    );
  }
  const live = isLive(match);
  const finished = isFinished(match);
  const zi = tzInfo(tz);
  const ko = fmt(match.utcDate, tz);
  const showScore = live || finished;
  return (
    <div style={{ background: color.ink, borderRadius: 18, padding: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        {live ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color.liveDot, animation: "tl-pulse 1.4s ease infinite" }} />
            <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".14em", color: color.liveText }}>LIVE{match.minute ? ` · ${match.minute}'` : ""}</span>
          </div>
        ) : finished ? (
          <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".14em", color: color.win }}>LATEST RESULT</span>
        ) : (
          <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".14em", color: color.darkMuted }}>NEXT UP · {ko.date}</span>
        )}
        <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".1em", color: color.darkMuted }}>{(match.group ?? "").toUpperCase()}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
        <Side snapshot={snapshot} code={match.home.code} name={match.home.name} />
        <div style={{ textAlign: "center" }}>
          {showScore ? (
            <>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 52, lineHeight: 1, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>
                {match.score.home ?? 0} – {match.score.away ?? 0}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: ".12em", color: color.darkMuted, marginTop: 8 }}>{live ? "IN PROGRESS" : "FULL TIME"}</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 40, lineHeight: 1, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>{ko.time}</div>
              <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: ".12em", color: color.darkMuted, marginTop: 8 }}>{ko.date} · {zi.abbr}</div>
            </>
          )}
        </div>
        <Side snapshot={snapshot} code={match.away.code} name={match.away.name} />
      </div>
      <button onClick={() => onOpen(match.id)} style={{ marginTop: 24, width: "100%", background: color.accent, color: "#fff", border: "none", borderRadius: 11, padding: 12, fontFamily: font.ui, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Open Match Center →</button>
    </div>
  );
}

function Side({ snapshot, code, name }: { snapshot: Snapshot; code: string; name: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
      <Flag teams={snapshot.teams} code={code} width={54} height={38} radius={5} border="rgba(255,255,255,.18)" />
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, textAlign: "center" }}>{name}</div>
    </div>
  );
}

function FixtureRow({ snapshot, match, onOpen }: { snapshot: Snapshot; match: Match; onOpen: (id: string) => void }) {
  const { tz } = useApp();
  const zi = tzInfo(tz);
  const live = isLive(match);
  const ko = fmt(match.utcDate, tz);
  const scoreColor = live || match.status === "FINISHED" ? color.ink : color.disabledScore;
  return (
    <div onClick={() => onOpen(match.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 6px", borderTop: `1px solid ${color.rowDivider}`, cursor: "pointer" }}>
      <div style={{ width: 54, textAlign: "center", flex: "none" }}>
        {live ? (
          <div style={{ fontFamily: font.mono, fontSize: 10, color: color.negative, fontWeight: 600 }}>{match.minute ? `${match.minute}'` : "LIVE"}</div>
        ) : (
          <>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 13 }}>{ko.time}</div>
            <div style={{ fontFamily: font.mono, fontSize: 8.5, color: color.faint, marginTop: 2 }}>{zi.abbr}</div>
          </>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {[match.home, match.away].map((t, i) => (
          <div key={t.code} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: i === 0 ? 7 : 0 }}>
            <Flag teams={snapshot.teams} code={t.code} width={24} height={17} radius={2.5} />
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>{t.name}</span>
            <span style={{ marginLeft: "auto", fontFamily: font.display, fontWeight: 700, fontSize: 15, color: scoreColor }}>
              {(i === 0 ? match.score.home : match.score.away) ?? "–"}
            </span>
          </div>
        ))}
      </div>
      <div style={{ width: 150, flex: "none", textAlign: "right" }}>
        <div style={{ fontSize: 11.5, color: color.slate }}>{shortVenue(match.venue)}</div>
        <div style={{ fontFamily: font.mono, fontSize: 9.5, color: color.faint, marginTop: 3 }}>{match.channels.slice(0, 2).join(" · ") || "—"}</div>
      </div>
    </div>
  );
}

function opponent(m: Match, fav: string): string {
  return m.home.code === fav ? m.away.code : m.home.code;
}

function groupPosLabel(s: Snapshot, fav: string): string {
  const g = favGroup(s, fav);
  if (!g) return "Group stage";
  const row = g.rows.find((r) => r.teamCode === fav);
  if (!row) return g.name;
  return `${ordinal(row.rank)} in ${g.name} · ${row.points} pts`;
}

function ordinal(n: number): string {
  return ["1st", "2nd", "3rd", "4th"][n - 1] ?? `${n}th`;
}

function shortVenue(v: string | null): string {
  if (!v) return "";
  return v.split(",")[0];
}
