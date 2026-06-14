import { useState, type CSSProperties } from "react";
import type { Match, Snapshot } from "../../types";
import { color, font, shadow } from "../../lib/theme";
import { useApp } from "../../state/store";
import { fmt, relativeTime, tzInfo } from "../../lib/time";
import {
  defaultMatch,
  groupForMatch,
  isFinished,
  isLive,
  matchNews,
  rankedNews,
} from "../../lib/select";
import { getMatchDetail, type StatRow, type EventType } from "../../data/matchDetails";
import { Flag } from "../ui/Flag";

type Tab = "stats" | "summary" | "news" | "analysis" | "video";
const TABS: Tab[] = ["stats", "summary", "news", "analysis", "video"];

const card: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.hairline}`,
  borderRadius: 18,
  boxShadow: shadow.card,
  marginTop: 18,
};

export function MatchCenter({ snapshot }: { snapshot: Snapshot }) {
  const { tz, selectedMatchId, now } = useApp();
  const [tab, setTab] = useState<Tab>("stats");
  const match = defaultMatch(snapshot, selectedMatchId);

  if (!match) {
    return <EmptyCard text="No match selected. Open a fixture from Today or the Schedule." />;
  }

  const detail = getMatchDetail(match.id);
  const zi = tzInfo(tz);
  const statusPill = isFinished(match)
    ? { text: "FULL TIME", c: color.win }
    : isLive(match)
      ? { text: match.minute ? `LIVE · ${match.minute}'` : "LIVE", c: color.negative }
      : { text: "UPCOMING", c: color.darkMuted };

  return (
    <div>
      {/* Header */}
      <div style={{ background: color.ink, borderRadius: 18, padding: "24px 28px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".12em", color: color.darkMuted }}>
            {(match.group ?? "Match")}{match.matchday ? ` · Matchday ${match.matchday}` : ""} · {fmt(match.utcDate, zi.id).date}, 2026
          </span>
          <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".12em", color: statusPill.c, border: `1px solid ${statusPill.c}66`, borderRadius: 999, padding: "4px 10px" }}>{statusPill.text}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 34, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, justifyContent: "flex-end", minWidth: 120 }}>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 20, textAlign: "right" }}>{match.home.name}</div>
            <Flag teams={snapshot.teams} code={match.home.code} width={58} height={40} radius={6} border="rgba(255,255,255,.18)" />
          </div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 46, lineHeight: 1, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>
            {match.score.home ?? "–"} – {match.score.away ?? "–"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 120 }}>
            <Flag teams={snapshot.teams} code={match.away.code} width={58} height={40} radius={6} border="rgba(255,255,255,.18)" />
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 20 }}>{match.away.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.1)", flexWrap: "wrap" }}>
          <Fact label="VENUE" value={match.venue ?? "TBC"} />
          <Fact label="KICKOFF · VENUE" value={match.venueZone ? `${fmt(match.utcDate, match.venueZone).full} ${match.venueAbbr ?? ""}` : "—"} />
          <Fact label="KICKOFF · YOUR TIME" value={`${fmt(match.utcDate, tz).full} ${zi.abbr}`} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${color.hairline}`, marginTop: 8, padding: "0 4px", overflowX: "auto" }}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ appearance: "none", background: "none", border: "none", cursor: "pointer", padding: "13px 4px", marginRight: 22, fontFamily: font.ui, fontWeight: active ? 700 : 500, fontSize: 14.5, color: active ? color.ink : color.muted, borderBottom: active ? `2.5px solid ${color.accent}` : "2.5px solid transparent", textTransform: "capitalize", whiteSpace: "nowrap" }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {tab === "stats" && <StatsTab snapshot={snapshot} match={match} detail={detail} />}
      {tab === "summary" && <SummaryTab snapshot={snapshot} detail={detail} />}
      {tab === "news" && <NewsTab snapshot={snapshot} match={match} now={now} />}
      {tab === "analysis" && <AnalysisTab detail={detail} />}
      {tab === "video" && <VideoTab detail={detail} />}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".1em", color: color.darkFaint }}>{label}</div>
      <div style={{ fontSize: 12.5, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div style={{ ...card, padding: 40, textAlign: "center", color: color.muted, fontSize: 14 }}>{text}</div>
  );
}

// Shown when the feed has no advanced stats: the facts + group standings we do
// have, so the Match Center is useful on the free tier instead of blank.
function MatchFacts({ snapshot, match }: { snapshot: Snapshot; match: Match }) {
  const { tz } = useApp();
  const zi = tzInfo(tz);
  const group = groupForMatch(snapshot, match);
  const result =
    match.score.home != null && match.score.away != null
      ? `${match.score.home} – ${match.score.away}`
      : isLive(match)
        ? "In progress"
        : "Not started";

  const facts: Array<[string, string]> = [
    [isFinished(match) ? "Result" : "Status", isFinished(match) ? result : isLive(match) ? `${result}${match.minute ? ` · ${match.minute}'` : ""}` : "Upcoming"],
    ["Stage", `${match.group ?? match.stage ?? "—"}${match.matchday ? ` · Matchday ${match.matchday}` : ""}`],
    ["Kickoff · your time", `${fmt(match.utcDate, tz).full} ${zi.abbr}`],
    ["Kickoff · venue", match.venueZone ? `${fmt(match.utcDate, match.venueZone).full} ${match.venueAbbr ?? ""}` : "—"],
    ["Venue", match.venue ?? "To be confirmed"],
  ];

  return (
    <div style={{ ...card, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16 }}>Match facts</div>
        <span style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".08em", color: color.faint }}>SCORES &amp; STANDINGS</span>
      </div>
      {facts.map(([label, value]) => (
        <div key={label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "10px 0", borderTop: `1px solid ${color.rowDivider}` }}>
          <span style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: ".08em", color: color.muted, textTransform: "uppercase" }}>{label}</span>
          <span style={{ fontWeight: 600, fontSize: 13.5, textAlign: "right" }}>{value}</span>
        </div>
      ))}

      {group && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14 }}>{group.name}</div>
            <span style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".1em", color: color.faint }}>P W D L GD PTS</span>
          </div>
          {group.rows.map((r) => {
            const inMatch = r.teamCode === match.home.code || r.teamCode === match.away.code;
            const gd = r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference < 0 ? `−${Math.abs(r.goalDifference)}` : "0";
            return (
              <div key={r.teamCode} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: `1px solid ${color.rowDivider}` }}>
                <span style={{ width: 14, fontFamily: font.mono, fontSize: 11, color: r.rank <= 2 ? color.win : r.rank === 3 ? color.caution : color.faint, fontWeight: 600 }}>{r.rank}</span>
                <Flag teams={snapshot.teams} code={r.teamCode} width={22} height={15} radius={2} />
                <span style={{ fontWeight: inMatch ? 700 : 500, fontSize: 13.5, color: inMatch ? color.accent : color.ink }}>{snapshot.teams[r.teamCode]?.name ?? r.teamCode}</span>
                <span style={{ marginLeft: "auto", fontFamily: font.mono, fontSize: 11, color: color.muted }}>{`${r.played} ${r.won} ${r.draw} ${r.lost} · ${gd}`}</span>
                <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13.5, width: 22, textAlign: "right" }}>{r.points}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11.5, color: color.faint, lineHeight: 1.5 }}>
        Detailed stats (possession, xG, shots) and timelines aren't available from our free data source — scores and standings update on every refresh.
      </div>
    </div>
  );
}

// ---- Stats -----------------------------------------------------------------
function StatsTab({ snapshot, match, detail }: { snapshot: Snapshot; match: Match; detail: ReturnType<typeof getMatchDetail> }) {
  const [statMode, setStatMode] = useState<"agg" | "compare">("agg");
  const [expanded, setExpanded] = useState<number | null>(null);

  // No advanced stats from the free feed → show the match facts + group table
  // we DO have, so the tab is informative rather than empty.
  if (!detail || detail.stats.length === 0) {
    return <MatchFacts snapshot={snapshot} match={match} />;
  }

  const seg = (active: boolean): CSSProperties => ({
    appearance: "none", border: "none", cursor: "pointer", padding: "7px 15px", borderRadius: 8, fontFamily: font.ui, fontWeight: 600, fontSize: 12.5,
    background: active ? color.surface : "transparent", color: active ? color.ink : color.muted, boxShadow: active ? "0 1px 2px rgba(20,22,29,.1)" : "none",
  });

  return (
    <div style={{ ...card, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <LegendDot c={color.accent} label={match.home.name} />
          <LegendDot c={color.ink} label={match.away.name} />
        </div>
        <div style={{ display: "flex", gap: 2, background: "#EFEFEA", border: `1px solid ${color.hairline}`, borderRadius: 10, padding: 3 }}>
          <button onClick={() => { setStatMode("agg"); setExpanded(null); }} style={seg(statMode === "agg")}>Aggregated</button>
          <button onClick={() => setStatMode("compare")} style={seg(statMode === "compare")}>Compare sources</button>
        </div>
      </div>

      {detail.stats.map((s, i) => (
        <StatRowView key={i} s={s} open={!!s.sources && (statMode === "compare" || expanded === i)} onToggle={() => s.sources && setExpanded(expanded === i ? null : i)} />
      ))}
    </div>
  );
}

function LegendDot({ c, label }: { c: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
      <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
    </div>
  );
}

function fmtStat(v: number, s: StatRow): string {
  return (s.dec ? v.toFixed(2) : String(v)) + (s.unit ?? "");
}

function StatRowView({ s, open, onToggle }: { s: StatRow; open: boolean; onToggle: () => void }) {
  const tot = s.home + s.away || 1;
  const hp = (s.home / tot) * 100;
  const ap = (s.away / tot) * 100;
  return (
    <div
      onClick={onToggle}
      style={{ padding: "15px 14px", borderRadius: 12, background: s.emphasize ? color.advTint : "transparent", border: s.emphasize ? `1px solid ${color.advTintBorder}` : "1px solid transparent", marginBottom: 2, cursor: s.sources ? "pointer" : "default" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: color.accent, width: 64 }}>{fmtStat(s.home, s)}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: color.slate, fontWeight: 500 }}>
          {s.label}
          <span style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".06em", color: color.faint, border: `1px solid ${color.hairline}`, borderRadius: 999, padding: "2px 7px" }}>
            {s.sources ? `${s.sources.length} sources` : "consensus"} {s.sources ? (open ? "–" : "+") : ""}
          </span>
        </span>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: color.ink, width: 64, textAlign: "right" }}>{fmtStat(s.away, s)}</span>
      </div>
      <div style={{ display: "flex", gap: 5, height: 7 }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: `${hp.toFixed(1)}%`, height: "100%", background: color.accent, borderRadius: 4 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: `${ap.toFixed(1)}%`, height: "100%", background: color.ink, borderRadius: 4 }} />
        </div>
      </div>
      {open && s.sources && (
        <div style={{ marginTop: 13, paddingTop: 13, borderTop: "1px dashed #D9D4F0" }}>
          <div style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".1em", color: "#9189C4", marginBottom: 8 }}>SOURCE-BY-SOURCE</div>
          {s.sources.map((src) => (
            <div key={src.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 13, color: color.accent, width: 64 }}>{src.home}</span>
              <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: ".04em", color: color.slate }}>{src.name}</span>
              <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 13, color: color.ink, width: 64, textAlign: "right" }}>{src.away}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Summary ---------------------------------------------------------------
function SummaryTab({ snapshot, detail }: { snapshot: Snapshot; detail: ReturnType<typeof getMatchDetail> }) {
  if (!detail || detail.events.length === 0) {
    return <EmptyCard text="A minute-by-minute timeline isn't available for this match from our data source." />;
  }
  const dotColor: Record<EventType, string> = { goal: color.ink, pen: color.ink, yellow: color.cardAmber, sub: color.accent, ft: color.win };
  const labelText: Record<EventType, string> = { goal: "GOAL", pen: "PENALTY", yellow: "YELLOW", sub: "SUB", ft: "FULL TIME" };
  return (
    <div style={{ ...card, padding: 24 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Match timeline</div>
      {detail.events.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderTop: `1px solid ${color.rowDivider}` }}>
          <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 600, color: color.ink, width: 38, flex: "none", paddingTop: 1 }}>{e.min}'</span>
          <div style={{ marginTop: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: e.type === "yellow" ? 2 : "50%", background: dotColor[e.type], flex: "none" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{e.main}</span>
              <span style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".08em", color: dotColor[e.type] }}>{labelText[e.type]}</span>
            </div>
            <div style={{ fontSize: 12, color: color.muted, marginTop: 2 }}>{e.sub}</div>
          </div>
          {e.team && <Flag teams={snapshot.teams} code={e.team} width={24} height={16} radius={2.5} />}
        </div>
      ))}
    </div>
  );
}

// ---- News ------------------------------------------------------------------
function NewsTab({ snapshot, match, now }: { snapshot: Snapshot; match: Match; now: number }) {
  const related = matchNews(snapshot, match);
  // Fall back to general tournament headlines so the tab isn't empty when the
  // feed has nothing tagged to either team.
  const items = related.length ? related : rankedNews(snapshot, match.home.code, 6);
  const heading = related.length ? null : "No headlines tagged to these teams yet — latest from across the tournament:";
  if (items.length === 0) {
    return <EmptyCard text="No headlines available yet." />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
      {heading && <div style={{ fontSize: 12.5, color: color.muted, marginBottom: 2 }}>{heading}</div>}
      {items.map((n) => (
        <a key={n.id} href={n.link} target="_blank" rel="noopener noreferrer" style={{ background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 16, padding: 20, boxShadow: shadow.card, display: "flex", gap: 18, textDecoration: "none", color: "inherit" }}>
          <div style={{ width: 120, height: 80, borderRadius: 10, flex: "none", backgroundImage: "repeating-linear-gradient(135deg,#EFEFEA 0 8px,#F6F6F3 8px 16px)", border: `1px solid ${color.hairline}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: font.mono, fontSize: 8, letterSpacing: ".1em", color: "#B5B9C0" }}>IMAGE</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".1em", color: color.accent, marginBottom: 8 }}>{n.source.toUpperCase()} · {relativeTime(n.publishedAt, now)} ago</div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, lineHeight: 1.3, marginBottom: 7 }}>{n.title}</div>
            <div style={{ fontSize: 13, color: color.slate, lineHeight: 1.5 }}>{n.snippet}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ---- Analysis --------------------------------------------------------------
function AnalysisTab({ detail }: { detail: ReturnType<typeof getMatchDetail> }) {
  if (!detail || detail.analysis.length === 0) {
    return <EmptyCard text="Tactical analysis isn't available for this match from our data source." />;
  }
  return (
    <div className="tl-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
      {detail.analysis.map((a, i) => (
        <div key={i} style={{ background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 16, padding: 22, boxShadow: shadow.card }}>
          <div style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".12em", color: color.faint, marginBottom: 12 }}>{a.author}</div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18, lineHeight: 1.25, marginBottom: 12 }}>{a.title}</div>
          <div style={{ fontSize: 13.5, color: color.slate, lineHeight: 1.6, marginBottom: 18 }}>{a.body}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, paddingTop: 16, borderTop: `1px solid ${color.rowDivider}` }}>
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: color.accent, letterSpacing: "-.02em" }}>{a.stat}</span>
            <span style={{ fontSize: 12.5, color: color.muted }}>{a.statLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Video -----------------------------------------------------------------
function VideoTab({ detail }: { detail: ReturnType<typeof getMatchDetail> }) {
  if (!detail || detail.clips.length === 0) {
    return <EmptyCard text="Video clips aren't available for this match from our data source." />;
  }
  return (
    <div className="tl-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
      {detail.clips.map((c, i) => (
        <div key={i} style={{ background: color.surface, border: `1px solid ${color.hairline}`, borderRadius: 16, overflow: "hidden", boxShadow: shadow.card, cursor: "pointer" }}>
          <div style={{ position: "relative", aspectRatio: "16/9", backgroundImage: "repeating-linear-gradient(135deg,#1B1D23 0 10px,#222530 10px 20px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 0, height: 0, borderLeft: `15px solid ${color.ink}`, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", marginLeft: 4 }} />
            </div>
            <span style={{ position: "absolute", top: 12, left: 12, fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".1em", color: "#fff", background: "rgba(43,87,255,.9)", borderRadius: 5, padding: "3px 7px" }}>{c.tag}</span>
            <span style={{ position: "absolute", bottom: 12, right: 12, fontFamily: font.mono, fontSize: 10, color: "#fff", background: "rgba(0,0,0,.6)", borderRadius: 5, padding: "3px 7px" }}>{c.dur}</span>
          </div>
          <div style={{ padding: "15px 16px" }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{c.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
