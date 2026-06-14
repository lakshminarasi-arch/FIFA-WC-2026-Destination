import type { Snapshot } from "../../types";
import { color, font, shadow } from "../../lib/theme";
import { useApp } from "../../state/store";
import { Flag } from "../ui/Flag";

// Favorite-team picker modal. Selecting a team updates the whole app (sidebar,
// Today, My Team, Schedule highlighting). Clicking the scrim or × closes it;
// clicks inside the panel must not bubble to the scrim.
export function TeamPicker({ snapshot }: { snapshot: Snapshot }) {
  const { menu, setMenu, fav, setFav } = useApp();
  if (menu !== "team") return null;

  const codes = Object.keys(snapshot.teams).sort((a, b) =>
    snapshot.teams[a].name.localeCompare(snapshot.teams[b].name),
  );

  return (
    <div
      onClick={() => setMenu(null)}
      style={{ position: "fixed", inset: 0, background: "rgba(20,22,29,.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: color.surface, borderRadius: 20, padding: 26, width: 560, maxWidth: "100%", maxHeight: "82vh", overflowY: "auto", boxShadow: shadow.modal }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20 }}>Choose your team</div>
            <div style={{ fontSize: 13, color: color.muted, marginTop: 3 }}>Track its journey, group and fixtures across the tournament.</div>
          </div>
          <button
            onClick={() => setMenu(null)}
            style={{ width: 34, height: 34, flex: "none", borderRadius: "50%", border: `1px solid ${color.hairline}`, background: color.surface, cursor: "pointer", fontSize: 18, lineHeight: 1, color: color.muted }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {codes.map((c) => {
            const active = c === fav;
            return (
              <div
                key={c}
                onClick={() => setFav(c)}
                style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 11, border: active ? `1.5px solid ${color.accent}` : `1px solid ${color.hairline}`, background: active ? color.accentTint : color.surface, cursor: "pointer" }}
              >
                <Flag teams={snapshot.teams} code={c} width={32} height={22} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{snapshot.teams[c].name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
