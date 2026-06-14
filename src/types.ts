// Shared data contract. The frontend consumes ONLY this shape — produced either
// by the bundled fixtures (dev) or by the Netlify `get-data` function (prod),
// which transforms football-data.org + RSS into it. Keeping the UI decoupled
// from upstream field names is what lets us "conform the data to the component".

export type FlagDir = "h" | "v";

export interface Team {
  code: string; // 3-letter code, e.g. "ARG"
  name: string;
  /** CSS gradient colour bands — a placeholder, not real flag art. */
  flag: string[];
  flagDir: FlagDir;
}

export interface StandingRow {
  teamCode: string;
  rank: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Group {
  /** Display name, e.g. "Group C". */
  name: string;
  /** Single letter, e.g. "C". */
  letter: string;
  rows: StandingRow[];
}

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED";

export interface MatchTeamRef {
  code: string;
  name: string;
}

export interface Match {
  id: string;
  /** Kickoff as a UTC instant (ISO 8601). */
  utcDate: string;
  status: MatchStatus;
  /** Live minute when IN_PLAY, else null. football-data free tier rarely sends this. */
  minute: number | null;
  matchday: number | null;
  /** Raw stage, e.g. "GROUP_STAGE", "ROUND_OF_16", "FINAL". */
  stage: string | null;
  /** Display group, e.g. "Group C", or null for knockout. */
  group: string | null;
  home: MatchTeamRef;
  away: MatchTeamRef;
  score: { home: number | null; away: number | null };
  venue: string | null;
  /** IANA tz of the venue, derived from a venue lookup. */
  venueZone: string | null;
  /** Short venue tz label, e.g. "ET", "CT", "PT", "CST". */
  venueAbbr: string | null;
  /** Telecast partners — only present in fixtures; football-data does not supply these. */
  channels: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  /** Always link OUT to the original article. */
  link: string;
  source: string;
  publishedAt: string; // ISO
  /** Short feed snippet only — never full article text. */
  snippet: string;
  /** Detected team codes + topical tags (e.g. "WC2026"). */
  teams: string[];
}

export interface TeamProfile {
  code: string;
  confederation: string | null;
  fifaRank: number | null;
  coach: string | null;
  group: string | null;
  /** Prose qualification summary — fixtures only. */
  qualSummary: string | null;
  /** Recent form, most-recent-last: [["W","NGA"], ...]. Fixtures only. */
  form: Array<["W" | "D" | "L", string]>;
}

export interface Snapshot {
  lastUpdated: string; // ISO
  competition: {
    name: string;
    currentMatchday: number | null;
    season: string | null;
  };
  teams: Record<string, Team>;
  groups: Group[];
  matches: Match[];
  news: NewsItem[];
  profiles: Record<string, TeamProfile>;
  meta: {
    matchesUpdated: string | null;
    newsUpdated: string | null;
    /** True when we are serving a stale/last-good snapshot after an upstream failure. */
    degraded: boolean;
  };
}
