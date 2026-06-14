import type { Group, Match, NewsItem, Snapshot } from "../types";
import { dayKey } from "./time";

export function isLive(m: Match): boolean {
  return m.status === "IN_PLAY" || m.status === "PAUSED";
}

export function isFinished(m: Match): boolean {
  return m.status === "FINISHED";
}

export function involvesTeam(m: Match, code: string): boolean {
  return m.home.code === code || m.away.code === code;
}

export function liveMatch(s: Snapshot): Match | undefined {
  return s.matches.find(isLive);
}

/** The match the Match Center should show: the explicitly-selected one, else a
 *  sensible default (live → most recent finished → next upcoming → first). */
export function defaultMatch(s: Snapshot, selectedId: string | null): Match | undefined {
  if (selectedId) {
    const m = s.matches.find((x) => x.id === selectedId);
    if (m) return m;
  }
  const live = liveMatch(s);
  if (live) return live;
  const finished = [...s.matches].filter(isFinished).sort(byKickoff);
  if (finished.length) return finished[finished.length - 1];
  const upcoming = [...s.matches]
    .filter((m) => !isFinished(m))
    .sort(byKickoff);
  return upcoming[0] ?? s.matches[0];
}

export function groupForMatch(s: Snapshot, m: Match | undefined): Group | undefined {
  if (!m) return undefined;
  if (m.group) return s.groups.find((g) => g.name === m.group);
  return s.groups.find((g) =>
    g.rows.some((r) => r.teamCode === m.home.code || r.teamCode === m.away.code),
  );
}

export function byKickoff(a: Match, b: Match): number {
  return Date.parse(a.utcDate) - Date.parse(b.utcDate);
}

export function favGroup(s: Snapshot, fav: string): Group | undefined {
  return s.groups.find((g) => g.rows.some((r) => r.teamCode === fav));
}

/** The favorite team's next upcoming match; if none, the most recent finished one. */
export function favNextMatch(
  s: Snapshot,
  fav: string,
  now: number,
): Match | undefined {
  const mine = s.matches.filter((m) => involvesTeam(m, fav)).sort(byKickoff);
  const upcoming = mine.find((m) => Date.parse(m.utcDate) >= now && !isFinished(m));
  if (upcoming) return upcoming;
  return [...mine].reverse().find(isFinished) ?? mine[0];
}

/** Matches on the same local day (user tz) as `now`; falls back to the soonest
 *  upcoming matches so the card is never empty mid-tournament. */
export function todayMatches(s: Snapshot, tz: string, now: number): Match[] {
  const todayKey = dayKey(now, tz);
  const onToday = s.matches
    .filter((m) => dayKey(m.utcDate, tz) === todayKey)
    .sort(byKickoff);
  if (onToday.length) return onToday;
  return s.matches
    .filter((m) => Date.parse(m.utcDate) >= now)
    .sort(byKickoff)
    .slice(0, 5);
}

export interface ScheduleDay {
  key: string;
  matches: Match[];
}

/** All matches grouped by local day (user tz), chronologically. */
export function scheduleByDay(s: Snapshot, tz: string): ScheduleDay[] {
  const map = new Map<string, Match[]>();
  for (const m of [...s.matches].sort(byKickoff)) {
    const k = dayKey(m.utcDate, tz);
    const arr = map.get(k) ?? [];
    arr.push(m);
    map.set(k, arr);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, matches]) => ({ key, matches }));
}

/** News filtered to the favorite team (plus tournament-wide items), favorites
 *  first — never hides the rest of the rail. */
export function rankedNews(
  s: Snapshot,
  fav: string,
  limit?: number,
): NewsItem[] {
  const scored = [...s.news].sort((a, b) => {
    const af = a.teams.includes(fav) ? 1 : 0;
    const bf = b.teams.includes(fav) ? 1 : 0;
    if (af !== bf) return bf - af;
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  });
  return limit ? scored.slice(0, limit) : scored;
}

export function matchNews(s: Snapshot, m: Match | undefined): NewsItem[] {
  if (!m) return [];
  return s.news
    .filter((n) => n.teams.includes(m.home.code) || n.teams.includes(m.away.code))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function statusBadge(m: Match): { label: string; live: boolean; finished: boolean } {
  if (isLive(m)) return { label: m.minute ? `${m.minute}'` : "LIVE", live: true, finished: false };
  if (isFinished(m)) return { label: "FT", live: false, finished: true };
  return { label: "", live: false, finished: false };
}
