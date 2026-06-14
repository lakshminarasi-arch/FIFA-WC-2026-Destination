import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import type {
  Group,
  Match,
  MatchStatus,
  StandingRow,
  Team,
  TeamProfile,
} from "../../src/types";
import { TEAM_CATALOG } from "../../src/lib/catalog";
import { fallbackTeam } from "../../src/lib/flags";
import { venueZone } from "../../src/lib/venues";

// Scheduled: pulls matches + standings + competition meta from football-data.org
// (server-side; key stays in env) and writes a normalised blob the frontend
// reads via get-data. On any upstream failure we DO NOT overwrite the last good
// blob — the site keeps serving the previous snapshot.
//
// NOTE: field names below follow football-data.org v4 as documented. Verify
// against football-data.org/documentation before relying on production data;
// the transform is defensive (optional chaining) so partial responses degrade.

const BASE = "https://api.football-data.org/v4";
const COMP = process.env.FOOTBALL_DATA_COMPETITION || "WC";

interface FDResponse {
  competition?: { name?: string; code?: string };
  currentSeason?: { currentMatchday?: number; startDate?: string };
  matches?: FDMatch[];
  standings?: FDStanding[];
}

interface FDTeam {
  id?: number;
  name?: string;
  shortName?: string;
  tla?: string;
}

interface FDMatch {
  id?: number;
  utcDate?: string;
  status?: string;
  matchday?: number;
  stage?: string;
  group?: string | null;
  homeTeam?: FDTeam;
  awayTeam?: FDTeam;
  score?: { fullTime?: { home?: number | null; away?: number | null } };
  venue?: string | null;
  minute?: number | null;
}

interface FDStanding {
  stage?: string;
  type?: string;
  group?: string | null;
  table?: Array<{
    position?: number;
    team?: FDTeam;
    playedGames?: number;
    won?: number;
    draw?: number;
    lost?: number;
    goalsFor?: number;
    goalsAgainst?: number;
    goalDifference?: number;
    points?: number;
  }>;
}

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: "SCHEDULED",
  TIMED: "TIMED",
  IN_PLAY: "IN_PLAY",
  PAUSED: "PAUSED",
  FINISHED: "FINISHED",
  SUSPENDED: "SUSPENDED",
  POSTPONED: "POSTPONED",
  CANCELLED: "CANCELLED",
  AWARDED: "FINISHED",
};

function code(t: FDTeam | undefined): string {
  return t?.tla || t?.shortName?.slice(0, 3).toUpperCase() || t?.name?.slice(0, 3).toUpperCase() || "TBD";
}

function teamFrom(t: FDTeam | undefined): Team {
  const c = code(t);
  const name = t?.name || t?.shortName || c;
  return TEAM_CATALOG[c] ? { ...TEAM_CATALOG[c], name } : fallbackTeam(c, name);
}

function groupLetter(g: string | null | undefined): string | null {
  if (!g) return null;
  // football-data may return "Group D", "GROUP_D", "GROUP D" or just "D".
  const m = /GROUP[\s_]*([A-Z])/i.exec(g) || /^([A-Z])$/i.exec(g.trim());
  return m ? m[1].toUpperCase() : null;
}

function groupLabel(g: string | null | undefined): string | null {
  const letter = groupLetter(g);
  return letter ? `Group ${letter}` : (g ?? null);
}

async function fetchFD(path: string): Promise<FDResponse> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY || "" },
  });
  if (!res.ok) throw new Error(`football-data ${path} → HTTP ${res.status}`);
  return (await res.json()) as FDResponse;
}

export async function runMatches(): Promise<Record<string, unknown>> {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return { ok: false, skipped: "FOOTBALL_DATA_API_KEY not set" };
  }

  try {
    const [meta, matchesRes, standingsRes] = await Promise.all([
      fetchFD(`/competitions/${COMP}`),
      fetchFD(`/competitions/${COMP}/matches`),
      fetchFD(`/competitions/${COMP}/standings`),
    ]);

    const teams: Record<string, Team> = {};
    const addTeam = (t: FDTeam | undefined) => {
      const c = code(t);
      if (!teams[c]) teams[c] = teamFrom(t);
    };

    const matches: Match[] = (matchesRes.matches ?? []).map((m) => {
      addTeam(m.homeTeam);
      addTeam(m.awayTeam);
      // Only derive a venue timezone when we actually have a venue — otherwise
      // leave it null rather than guessing Eastern (which made venue-local times
      // wrong for every non-Eastern stadium).
      const vz = m.venue ? venueZone(m.venue) : null;
      return {
        id: String(m.id ?? `${code(m.homeTeam)}-${code(m.awayTeam)}-${m.utcDate}`),
        utcDate: m.utcDate ?? new Date().toISOString(),
        status: STATUS_MAP[m.status ?? ""] ?? "SCHEDULED",
        minute: m.minute ?? null,
        matchday: m.matchday ?? null,
        stage: m.stage ?? null,
        group: groupLabel(m.group),
        home: { code: code(m.homeTeam), name: m.homeTeam?.name ?? code(m.homeTeam) },
        away: { code: code(m.awayTeam), name: m.awayTeam?.name ?? code(m.awayTeam) },
        score: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
        venue: m.venue ?? null,
        venueZone: vz ? vz.zone : null,
        venueAbbr: vz ? vz.abbr : null,
        channels: [], // football-data does not supply telecast partners
      };
    });

    const groups: Group[] = (standingsRes.standings ?? [])
      .filter((s) => (s.type ?? "TOTAL") === "TOTAL" && s.group)
      .map((s) => {
        const letter = groupLetter(s.group) ?? "?";
        const rows: StandingRow[] = (s.table ?? []).map((r) => {
          addTeam(r.team);
          return {
            teamCode: code(r.team),
            rank: r.position ?? 0,
            played: r.playedGames ?? 0,
            won: r.won ?? 0,
            draw: r.draw ?? 0,
            lost: r.lost ?? 0,
            goalsFor: r.goalsFor ?? 0,
            goalsAgainst: r.goalsAgainst ?? 0,
            goalDifference: r.goalDifference ?? 0,
            points: r.points ?? 0,
          };
        });
        return { name: `Group ${letter}`, letter, rows };
      });

    // Minimal profiles from standings (group membership). Rank/coach/form aren't
    // in football-data's free tier, so they stay null and the UI empty-states them.
    const profiles: Record<string, TeamProfile> = {};
    for (const g of groups) {
      for (const r of g.rows) {
        profiles[r.teamCode] = {
          code: r.teamCode,
          confederation: null,
          fifaRank: null,
          coach: null,
          group: g.name,
          qualSummary: null,
          form: [],
        };
      }
    }

    const blob = {
      updatedAt: new Date().toISOString(),
      competition: {
        name: meta.competition?.name ?? "FIFA World Cup 2026",
        currentMatchday: meta.currentSeason?.currentMatchday ?? null,
        season: meta.currentSeason?.startDate?.slice(0, 4) ?? "2026",
      },
      teams,
      groups,
      matches,
      profiles,
    };

    const store = getStore("touchline");
    await store.setJSON("matches", blob);

    return { ok: true, matches: matches.length, groups: groups.length };
  } catch (err) {
    // Keep the last good snapshot; just log.
    console.error("[fetch-matches] failed:", err);
    return { ok: false, error: String(err) };
  }
}

export default async (): Promise<Response> => {
  const result = await runMatches();
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  schedule: "*/2 * * * *",
};
