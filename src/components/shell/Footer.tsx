import type { Snapshot } from "../../types";
import { color, font } from "../../lib/theme";
import { useApp } from "../../state/store";
import { clock } from "../../lib/time";

// "Last updated" + required attribution. The delay is honest and visible.
export function Footer({ snapshot }: { snapshot: Snapshot }) {
  const { now, tz } = useApp();
  const updated = snapshot.lastUpdated ? clock(Date.parse(snapshot.lastUpdated), tz) : "—";

  return (
    <footer style={{ marginTop: 40, paddingTop: 18, borderTop: `1px solid ${color.hairline}`, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: ".08em", color: color.faint }}>
        LAST UPDATED {updated} · NOW {clock(now, tz)}
      </div>
      <div style={{ fontSize: 11.5, color: color.muted }}>
        Scores &amp; standings via{" "}
        <a href="https://www.football-data.org" target="_blank" rel="noopener noreferrer" style={{ color: color.accent, textDecoration: "none" }}>
          football-data.org
        </a>
        ; match stats via{" "}
        <a href="https://www.api-football.com" target="_blank" rel="noopener noreferrer" style={{ color: color.accent, textDecoration: "none" }}>
          API-Football
        </a>
        . News headlines link out to BBC Sport, The Guardian and other sources — full articles remain with the publisher.
      </div>
    </footer>
  );
}
