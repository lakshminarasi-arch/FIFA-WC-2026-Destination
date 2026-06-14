import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { matchKey, normalizeCountry } from "../../src/lib/matchkey";

// Scheduled: pulls REAL match statistics + the goal/card/sub timeline from
// API-Football (api-sports.io) for the World Cup, and caches them keyed by a
// cross-provider match key so get-data can attach them to football-data
// fixtures. NO predictions and NO betting odds are fetched — only factual match
// data. Respects the free tier (~100 req/day): one fixtures call per run, then
// stats/events only for matches we don't already have (finished matches are
// cached permanently; live matches refresh). Capped per run. On failure we keep
// the last good blob.
//
// Verify field names against the API-Football v3 docs if data looks off.

const BASE = "https://v3.football.api-sports.io";
const LEAGUE = process.env.API_FOOTBALL_LEAGUE || "1"; // 1 = FIFA World Cup
const SEASON = process.env.API_FOOTBALL_SEASON || "2026";
const MAX_FETCHES_PER_RUN = 22; // stay well under the daily cap

interface FixtureLite {
  id: number;
  date: string;
  statusShort: string;
  homeName: string;
  awayName: string;
}

type Side = "home" | "away" | null;

interface StatEntry {
  homeName: string;
  awayName: string;
  stats: Array<{ label: string; home: number; away: number; unit?: string; dec?: boolean }>;
  events: Array<{ min: string; type: string; side: Side; player: string; detail: string }>;
  status: string;
  fetchedAt: string;
}

async function af(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY || "" },
  });
  if (!res.ok) throw new Error(`API-Football ${path} → HTTP ${res.status}`);
  return res.json();
}

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace("%", "").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// API-Football statistic "type" → our label (+ unit). Only factual stats.
const STAT_MAP: Array<[string, string, string?, boolean?]> = [
  ["Ball Possession", "Possession", "%"],
  ["Total Shots", "Total shots"],
  ["Shots on Goal", "Shots on target"],
  ["expected_goals", "Expected goals (xG)", "", true],
  ["Corner Kicks", "Corners"],
  ["Passes accurate", "Accurate passes"],
  ["Passes %", "Pass accuracy", "%"],
  ["Fouls", "Fouls"],
  ["Yellow Cards", "Yellow cards"],
  ["Red Cards", "Red cards"],
];

function mapStats(homeStats: any[], awayStats: any[]): StatEntry["stats"] {
  const lookup = (arr: any[], type: string) =>
    arr?.find((s) => s.type === type)?.value ?? null;
  const out: StatEntry["stats"] = [];
  for (const [type, label, unit, dec] of STAT_MAP) {
    const hv = lookup(homeStats, type);
    const av = lookup(awayStats, type);
    if (hv == null && av == null) continue;
    out.push({ label, home: num(hv), away: num(av), ...(unit ? { unit } : {}), ...(dec ? { dec: true } : {}) });
  }
  return out;
}

function mapEvents(events: any[], homeName: string): StatEntry["events"] {
  const hn = normalizeCountry(homeName);
  return (events ?? [])
    .map((e) => {
      const t = String(e.type || "").toLowerCase();
      const detail = String(e.detail || "");
      let type = "";
      if (t === "goal") type = /penalty/i.test(detail) ? "pen" : "goal";
      else if (t === "card") type = /red/i.test(detail) ? "red" : "yellow";
      else if (t === "subst") type = "sub";
      else return null;
      const side: Side = e.team?.name ? (normalizeCountry(e.team.name) === hn ? "home" : "away") : null;
      const min = `${e.time?.elapsed ?? ""}${e.time?.extra ? "+" + e.time.extra : ""}`;
      return { min, type, side, player: e.player?.name ?? "", detail };
    })
    .filter((x): x is StatEntry["events"][number] => x !== null);
}

// Core logic, reused by the scheduled handler and the /api/refresh endpoint.
export async function runStats(): Promise<Record<string, unknown>> {
  if (!process.env.API_FOOTBALL_KEY) {
    return { ok: false, skipped: "API_FOOTBALL_KEY not set" };
  }
  const store = getStore("touchline");

  try {
    const prev = ((await store.get("stats", { type: "json" })) as
      | { updatedAt: string; entries: Record<string, StatEntry> }
      | null) ?? { updatedAt: "", entries: {} };
    const entries: Record<string, StatEntry> = { ...prev.entries };

    const fxRes = await af(`/fixtures?league=${LEAGUE}&season=${SEASON}`);
    const fixtures: FixtureLite[] = (fxRes.response ?? []).map((r: any) => ({
      id: r.fixture?.id,
      date: r.fixture?.date,
      statusShort: r.fixture?.status?.short ?? "NS",
      homeName: r.teams?.home?.name ?? "",
      awayName: r.teams?.away?.name ?? "",
    }));

    // Which fixtures need fetching: in-play (always refresh) or finished without
    // a cached stats entry yet.
    const live = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE"]);
    const done = new Set(["FT", "AET", "PEN"]);
    const needs = fixtures.filter((f) => {
      if (!f.id) return false;
      const key = matchKey(f.homeName, f.awayName, f.date);
      const cached = entries[key];
      if (live.has(f.statusShort)) return true;
      if (done.has(f.statusShort)) return !cached || cached.stats.length === 0;
      return false;
    });

    let fetched = 0;
    for (const f of needs) {
      if (fetched >= MAX_FETCHES_PER_RUN) break;
      const key = matchKey(f.homeName, f.awayName, f.date);
      try {
        const [statsRes, eventsRes] = await Promise.all([
          af(`/fixtures/statistics?fixture=${f.id}`),
          af(`/fixtures/events?fixture=${f.id}`),
        ]);
        fetched += 2;
        const sr = statsRes.response ?? [];
        // align home/away by team name
        const hIdx = sr.findIndex((x: any) => normalizeCountry(x.team?.name) === normalizeCountry(f.homeName));
        const home = sr[hIdx >= 0 ? hIdx : 0];
        const away = sr[hIdx === 0 ? 1 : 0];
        entries[key] = {
          homeName: f.homeName,
          awayName: f.awayName,
          stats: mapStats(home?.statistics ?? [], away?.statistics ?? []),
          events: mapEvents(eventsRes.response ?? [], f.homeName),
          status: f.statusShort,
          fetchedAt: new Date().toISOString(),
        };
      } catch (e) {
        console.warn(`[fetch-stats] fixture ${f.id} failed:`, String(e));
      }
    }

    await store.setJSON("stats", { updatedAt: new Date().toISOString(), entries });
    return { ok: true, fixtures: fixtures.length, fetchedCalls: fetched, cached: Object.keys(entries).length };
  } catch (err) {
    console.error("[fetch-stats] failed:", err);
    return { ok: false, error: String(err) };
  }
}

export default async (): Promise<Response> => {
  const result = await runStats();
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  // Every 3 hours — stats don't change between matches, and this keeps us far
  // under the free-tier daily request cap.
  schedule: "0 */3 * * *",
};
