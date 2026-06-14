import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import type { Group, Match, NewsItem, Snapshot, TeamProfile } from "../../src/types";

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

export default async (): Promise<Response> => {
  const store = getStore("touchline");

  const matches = (await store.get("matches", { type: "json" })) as MatchesBlob | null;
  const news = (await store.get("news", { type: "json" })) as NewsBlob | null;

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
    matches: matches.matches,
    news: news?.items ?? [],
    profiles: matches.profiles ?? {},
    meta: {
      matchesUpdated: matches.updatedAt,
      newsUpdated: news?.updatedAt ?? null,
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
