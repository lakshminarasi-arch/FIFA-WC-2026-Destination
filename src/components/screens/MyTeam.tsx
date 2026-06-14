import type { CSSProperties } from "react";
import type { Snapshot, StandingRow } from "../../types";
import { color, font, shadow } from "../../lib/theme";
import { useApp } from "../../state/store";
import { favGroup } from "../../lib/select";
import { Flag } from "../ui/Flag";

const card: CSSProperties = {
  background: color.surface,
  border: `1px solid ${color.hairline}`,
  borderRadius: 18,
  boxShadow: shadow.card,
};

const UPCOMING = { mark: "", dotBg: color.surface, dotBorder: color.upcomingConnector, dotText: color.faint, lineColor: color.upcomingConnector, labelColor: color.faint };

interface Stage {
  stage: string;
  detail: string;
  mark: string;
  dotBg: string;
  dotBorder: string;
  dotText: string;
  lineColor: string;
  labelColor: string;
}

export function MyTeam({ snapshot }: { snapshot: Snapshot }) {
  const { fav, setMenu } = useApp();
  const team = snapshot.teams[fav];
  const profile = snapshot.profiles[fav];
  const group = favGroup(snapshot, fav);
  const row = group?.rows.find((r) => r.teamCode === fav);
  const pos = row ? row.rank : 0;
  const ord = (n: number) => ["1st", "2nd", "3rd", "4th"][n - 1] ?? `${n}th`;

  const stages: Stage[] = [
    { stage: "Qualifying", detail: `${profile?.confederation ?? "Qualified"}${pos ? ` · ${ord(pos)}` : ""}`, mark: "✓", dotBg: color.win, dotBorder: color.win, dotText: "#fff", lineColor: color.win, labelColor: color.ink },
    { stage: group ? group.name : "Group stage", detail: row ? `${row.played} of 3 played` : "Awaiting fixtures", mark: "●", dotBg: color.accent, dotBorder: color.accent, dotText: "#fff", lineColor: color.upcomingConnector, labelColor: color.accent },
    { stage: "Round of 32", detail: "Jun 29", ...UPCOMING },
    { stage: "Round of 16", detail: "Jul 4", ...UPCOMING },
    { stage: "Quarter-final", detail: "Jul 10", ...UPCOMING },
    { stage: "Semi-final", detail: "Jul 14", ...UPCOMING },
    { stage: "Final", detail: "Jul 19 · NJ", ...UPCOMING, lineColor: "transparent" },
  ];

  return (
    <div>
      {/* Team header */}
      <div style={{ ...card, padding: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <Flag teams={snapshot.teams} code={fav} width={72} height={50} radius={7} border="rgba(0,0,0,.1)" />
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 28, letterSpacing: "-.01em" }}>{team?.name ?? fav}</div>
          <div style={{ fontSize: 13.5, color: color.slate, marginTop: 2 }}>
            {profile?.confederation ?? "—"} · FIFA Rank {profile?.fifaRank ? `#${profile.fifaRank}` : "—"} · {profile?.coach ?? "Coach TBC"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <StatTile value={pos ? ord(pos) : "—"} label="GROUP POS" />
          <StatTile value={row ? String(row.points) : "—"} label="POINTS" />
          <button onClick={() => setMenu("team")} style={{ background: color.ink, color: "#fff", border: "none", borderRadius: 11, padding: "13px 16px", fontFamily: font.ui, fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Change team</button>
        </div>
      </div>

      {/* Journey */}
      <div style={{ ...card, padding: 24, marginTop: 20 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Road to the Final</div>
        <div style={{ fontSize: 13, color: color.muted, marginBottom: 24 }}>Qualification → group stage → knockout bracket.</div>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, overflowX: "auto", paddingBottom: 6 }}>
          {stages.map((s, i) => (
            <div key={i} style={{ flex: 1, minWidth: 118, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ position: "absolute", top: 13, left: "50%", right: "-50%", height: 2, background: s.lineColor }} />
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.dotBg, border: `2px solid ${s.dotBorder}`, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: font.mono, fontSize: 10, fontWeight: 600, color: s.dotText }}>{s.mark}</span>
              </div>
              <div style={{ marginTop: 13, textAlign: "center", padding: "0 6px" }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, color: s.labelColor, lineHeight: 1.25 }}>{s.stage}</div>
                <div style={{ fontSize: 11, color: color.faint, marginTop: 4, lineHeight: 1.3 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tl-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        {/* Group table */}
        <div style={{ ...card, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16 }}>{group ? `${group.name} table` : "Group table"}</div>
            <span style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: ".1em", color: color.faint }}>P W D L GD PTS</span>
          </div>
          {group ? (
            <>
              {group.rows.map((r) => (
                <GroupRow key={r.teamCode} snapshot={snapshot} row={r} fav={fav} />
              ))}
              <div style={{ display: "flex", gap: 14, marginTop: 14, paddingTop: 13, borderTop: `1px solid ${color.rowDivider}` }}>
                <Legend swatch={color.win} text="Qualify (top 2)" />
                <Legend swatch={color.caution} text="Best-third race" />
              </div>
            </>
          ) : (
            <div style={{ padding: "12px 0", fontSize: 13, color: color.muted }}>Group standings not available yet.</div>
          )}
        </div>

        {/* Qualification */}
        <div style={{ ...card, padding: 22 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, marginBottom: 14 }}>How they qualified</div>
          <div style={{ fontSize: 13, color: color.slate, marginBottom: 16, lineHeight: 1.5 }}>
            {profile?.qualSummary ?? "Qualification details for this team aren't available from our data source yet."}
          </div>
          {profile?.form?.length ? (
            <>
              <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: ".1em", color: color.faint, marginBottom: 10 }}>RECENT FORM</div>
              <div style={{ display: "flex", gap: 7 }}>
                {profile.form.map((f, i) => {
                  const bg = f[0] === "W" ? color.win : f[0] === "D" ? color.caution : color.negative;
                  return (
                    <div key={i} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 700, fontSize: 15 }}>{f[0]}</div>
                      <div style={{ fontSize: 10, color: color.faint, marginTop: 5 }}>{f[1]}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 16px", background: color.tile, border: `1px solid ${color.tileBorder}`, borderRadius: 12 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22 }}>{value}</div>
      <div style={{ fontFamily: font.mono, fontSize: 8.5, letterSpacing: ".08em", color: color.faint, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function GroupRow({ snapshot, row, fav }: { snapshot: Snapshot; row: StandingRow; fav: string }) {
  const qColor = row.rank <= 2 ? color.win : row.rank === 3 ? color.caution : color.faint;
  const gd = row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference < 0 ? `−${Math.abs(row.goalDifference)}` : "0";
  const isFav = row.teamCode === fav;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${color.rowDivider}` }}>
      <span style={{ width: 16, fontFamily: font.mono, fontSize: 11, color: qColor, fontWeight: 600 }}>{row.rank}</span>
      <Flag teams={snapshot.teams} code={row.teamCode} width={24} height={16} radius={2.5} />
      <span style={{ fontWeight: isFav ? 700 : 500, fontSize: 14, color: isFav ? color.accent : color.ink }}>{snapshot.teams[row.teamCode]?.name ?? row.teamCode}</span>
      <span style={{ marginLeft: "auto", fontFamily: font.mono, fontSize: 11.5, color: color.muted }}>{`${row.played} ${row.won} ${row.draw} ${row.lost} · ${gd}`}</span>
      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, width: 24, textAlign: "right" }}>{row.points}</span>
    </div>
  );
}

function Legend({ swatch, text }: { swatch: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: swatch }} />
      <span style={{ fontSize: 11, color: color.muted }}>{text}</span>
    </div>
  );
}
