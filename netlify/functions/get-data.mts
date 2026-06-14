import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import type {
  Group,
  LiveEvent,
  LiveStat,
  Match,
  NewsItem,
  Snapshot,
  TeamProfile,
} from "../../src/types";
import { matchKey, normalizeCountry } from "../../src/lib/matchkey";

// On-demand: assembles the cached snapshot the browser reads from /api/data.
// The browser NEVER calls football-data.org or RSS directly — only this. If no
// data has been cached yet, returns 503 so the frontend keeps its fixtures.

interface MatchesBlob {
  updatedAt: string;
  competition: Snapshot["competition"];
  teams: Snapshot["teams"];
  groups: Group[];
  matches: Match[];
  profiles: Record<string, TeamProfile>;
}

interface NewsBlob {
  updatedAt: string;
  items: NewsItem[];
}

interface StatEntry {
  homeName: string;
  awayName: string;
  stats: LiveStat[];
  events: Array<{ min: string; type: string; side: "home" | "away" | null; player: string; detail: string }>;
}
interface StatsBlob {
  updatedAt: string;
  entries: Record<string, StatEntry>;
}

// Attach API-Football stats/events onto football-data fixtures, fixing
// home/away orientation if the two providers disagree.
function withStats(matches: Match[], stats: StatsBlob | null): Match[] {
  if (!stats) return matches;
  return matches.map((m) => {
    const entry = stats.entries[matchKey(m.home.name, m.away.name, m.utcDate)];
    if (!entry) return m;
    const swapped = normalizeCountry(entry.homeName) !== normalizeCountry(m.home.name);
    const liveStats: LiveStat[] = entry.stats.map((s) =>
      swapped ? { ...s, home: s.away, away: s.home } : s,
    );
    const events: LiveEvent[] = entry.events.map((e) => {
      const side = swapped && e.side ? (e.side === "home" ? "away" : "home") : e.side;
      const teamCode = side === "home" ? m.home.code : side === "away" ? m.away.code : null;
      const type = (["goal", "pen", "yellow", "red", "sub"].includes(e.type) ? e.type : "goal") as LiveEvent["type"];
      return { min: e.min, type, teamCode, player: e.player, detail: e.detail };
    });
    return { ...m, stats: liveStats.length ? liveStats : null, events: events.length ? events : null };
  });
}

export default async (): Promise<Response> => {
  const store = getStore("touchline");

  const matches = (await store.get("matches", { type: "json" })) as MatchesBlob | null;
  const news = (await store.get("news", { type: "json" })) as NewsBlob | null;
  const stats = (await store.get("stats", { type: "json" })) as StatsBlob | null;

  if (!matches) {
    return new Response(
      JSON.stringify({ error: "no_data", message: "No cached match data yet." }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const snapshot: Snapshot = {
    lastUpdated: matches.updatedAt,
    competition: matches.competition,
    teams: matches.teams,
    groups: matches.groups,
    matches: withStats(matches.matches, stats),
    news: news?.items ?? [],
    profiles: matches.profiles ?? {},
    meta: {
      matchesUpdated: matches.updatedAt,
      newsUpdated: news?.updatedAt ?? null,
      statsUpdated: stats?.updatedAt ?? null,
      degraded: false,
    },
  };

  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: {
      "content-type": "application/json",
      // Allow a brief edge cache; scheduled fns refresh the underlying blobs.
      "cache-control": "public, max-age=30",
    },
  });
};

export const config: Config = {
  path: "/api/data",
};
