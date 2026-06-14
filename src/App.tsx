import { color, font } from "./lib/theme";
import { useApp } from "./state/store";
import { useSnapshot } from "./data/useSnapshot";
import { Sidebar } from "./components/shell/Sidebar";
import { TopBar } from "./components/shell/TopBar";
import { BottomNav } from "./components/shell/BottomNav";
import { TeamPicker } from "./components/shell/TeamPicker";
import { Today } from "./components/screens/Today";
import { MyTeam } from "./components/screens/MyTeam";
import { MatchCenter } from "./components/screens/MatchCenter";
import { Schedule } from "./components/screens/Schedule";
import { Footer } from "./components/shell/Footer";
import { clock } from "./lib/time";

export default function App() {
  const { screen, now } = useApp();
  const { data, usingFallback } = useSnapshot();

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: font.ui, color: color.ink, background: color.paper }}>
      <Sidebar teams={data.teams} />

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar snapshot={data} />

        <div id="tl-scroll" style={{ flex: 1, overflowY: "auto" }}>
          <div className="tl-content" style={{ maxWidth: 1180, margin: "0 auto", padding: 28 }}>
            {usingFallback && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: color.advTint, border: `1px solid ${color.advTintBorder}`, borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color.caution, flex: "none" }} />
                <span style={{ fontSize: 12.5, color: color.slate }}>
                  Showing sample data — the live feed isn't connected yet. Times still update to your selected zone ({clock(now, "America/New_York")} ET host time).
                </span>
              </div>
            )}

            {screen === "today" && <Today snapshot={data} />}
            {screen === "team" && <MyTeam snapshot={data} />}
            {screen === "match" && <MatchCenter snapshot={data} />}
            {screen === "sched" && <Schedule snapshot={data} />}

            <Footer snapshot={data} />
          </div>
        </div>
      </main>

      <BottomNav />
      <TeamPicker snapshot={data} />
    </div>
  );
}
