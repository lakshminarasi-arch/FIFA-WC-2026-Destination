import type {
  Group,
  Match,
  NewsItem,
  Snapshot,
  StandingRow,
  TeamProfile,
} from "../types";
import { TEAM_CATALOG } from "../lib/catalog";
import { venueZone } from "../lib/venues";

// Realistic local fixtures mirroring the Touchline prototype's sample data, in
// our Snapshot contract. Used in dev and as the graceful fallback when the live
// feed is unavailable. In production the Netlify functions overwrite this with
// real football-data.org + RSS content.

const iso = (y: number, mo: number, d: number, h: number, mi: number) =>
  new Date(Date.UTC(y, mo, d, h, mi)).toISOString();

// [code, won, draw, lost, points, goalDifference, goalsFor, goalsAgainst]
type Raw = [string, number, number, number, number, number, number, number];

const GROUPS_RAW: Record<string, Raw[]> = {
  A: [
    ["MEX", 1, 0, 0, 3, 1, 1, 0],
    ["GER", 1, 0, 0, 3, 2, 2, 0],
    ["CRO", 0, 0, 1, 0, -2, 0, 2],
    ["KSA", 0, 0, 1, 0, -1, 0, 1],
  ],
  C: [
    ["ARG", 1, 0, 0, 3, 1, 2, 1],
    ["POL", 1, 0, 0, 3, 1, 1, 0],
    ["NGA", 0, 0, 1, 0, -1, 1, 2],
    ["KOR", 0, 0, 1, 0, -1, 0, 1],
  ],
  F: [
    ["BRA", 1, 0, 0, 3, 2, 2, 0],
    ["FRA", 1, 0, 0, 3, 1, 1, 0],
    ["ESP", 0, 0, 1, 0, -1, 0, 1],
    ["JPN", 0, 0, 1, 0, -2, 0, 2],
  ],
};

function buildGroups(): Group[] {
  return Object.entries(GROUPS_RAW).map(([letter, raws]) => {
    const rows: StandingRow[] = raws.map((r, i) => ({
      teamCode: r[0],
      rank: i + 1,
      played: r[1] + r[2] + r[3],
      won: r[1],
      draw: r[2],
      lost: r[3],
      points: r[4],
      goalDifference: r[5],
      goalsFor: r[6],
      goalsAgainst: r[7],
    }));
    return { name: `Group ${letter}`, letter, rows };
  });
}

const PROFILES: Record<string, TeamProfile> = {
  ARG: { code: "ARG", confederation: "CONMEBOL", fifaRank: 1, coach: "L. Scaloni", group: "C", qualSummary: "Topped CONMEBOL qualifying with 38 points from 18 matches — the first nation to seal a 2026 berth.", form: [["W", "NGA"], ["W", "ECU"], ["D", "BRA"], ["W", "CHI"], ["W", "URU"]] },
  POL: { code: "POL", confederation: "UEFA", fifaRank: 26, coach: "M. Probierz", group: "C", qualSummary: "Came through the UEFA play-off path to reach a fourth straight World Cup.", form: [["W", "KOR"], ["L", "NED"], ["W", "ALB"], ["D", "CZE"], ["W", "FIN"]] },
  NGA: { code: "NGA", confederation: "CAF", fifaRank: 39, coach: "E. Chelle", group: "C", qualSummary: "Won a tight CAF group on the final matchday to return to the finals.", form: [["L", "ARG"], ["W", "RSA"], ["D", "CIV"], ["W", "BEN"], ["W", "RWA"]] },
  KOR: { code: "KOR", confederation: "AFC", fifaRank: 23, coach: "Hong Myung-bo", group: "C", qualSummary: "Came through the AFC third round unbeaten to qualify.", form: [["L", "POL"], ["W", "IRQ"], ["D", "JPN"], ["W", "OMA"], ["W", "JOR"]] },
  BRA: { code: "BRA", confederation: "CONMEBOL", fifaRank: 5, coach: "C. Ancelotti", group: "F", qualSummary: "Qualified from CONMEBOL with games to spare under Ancelotti.", form: [["W", "JPN"], ["W", "PAR"], ["D", "ARG"], ["W", "PER"], ["W", "COL"]] },
  FRA: { code: "FRA", confederation: "UEFA", fifaRank: 2, coach: "D. Deschamps", group: "F", qualSummary: "Won their UEFA qualifying group with a perfect record.", form: [["W", "ESP"], ["W", "ISL"], ["W", "UKR"], ["D", "ITA"], ["W", "BEL"]] },
  ESP: { code: "ESP", confederation: "UEFA", fifaRank: 3, coach: "L. de la Fuente", group: "F", qualSummary: "Reigning European champions qualified comfortably.", form: [["L", "FRA"], ["W", "TUR"], ["W", "GEO"], ["W", "SCO"], ["D", "GER"]] },
  JPN: { code: "JPN", confederation: "AFC", fifaRank: 18, coach: "H. Moriyasu", group: "F", qualSummary: "First side after the hosts to qualify, winning their AFC group early.", form: [["L", "BRA"], ["W", "KOR"], ["W", "AUS"], ["W", "BHR"], ["D", "KSA"]] },
  MEX: { code: "MEX", confederation: "CONCACAF · host", fifaRank: 14, coach: "J. Aguirre", group: "A", qualSummary: "Qualified automatically as one of the three host nations.", form: [["W", "KSA"], ["D", "USA"], ["W", "CAN"], ["L", "BRA"], ["W", "JAM"]] },
  GER: { code: "GER", confederation: "UEFA", fifaRank: 10, coach: "J. Nagelsmann", group: "A", qualSummary: "Won their UEFA qualifying group to book a place.", form: [["W", "CRO"], ["W", "SVK"], ["D", "ESP"], ["W", "NIR"], ["L", "NED"]] },
  CRO: { code: "CRO", confederation: "UEFA", fifaRank: 9, coach: "M. Dalić", group: "A", qualSummary: "Came through a UEFA play-off to reach another finals.", form: [["L", "GER"], ["W", "SVN"], ["D", "CZE"], ["W", "WAL"], ["W", "LVA"]] },
  KSA: { code: "KSA", confederation: "AFC", fifaRank: 58, coach: "H. Renard", group: "A", qualSummary: "Qualified from the AFC third round on the final day.", form: [["L", "MEX"], ["D", "JPN"], ["W", "BHR"], ["W", "CHN"], ["L", "AUS"]] },
};

function ref(code: string) {
  return { code, name: TEAM_CATALOG[code]?.name ?? code };
}

// [id, utcDate, status, minute, group, home, away, hs, as, venue, channels]
type RawMatch = [
  string,
  string,
  Match["status"],
  number | null,
  string,
  string,
  string,
  number | null,
  number | null,
  string,
  string[],
];

const MATCHES_RAW: RawMatch[] = [
  // The finished Match Center showcase fixture.
  ["wc-arg-nga", iso(2026, 5, 13, 1, 0), "FINISHED", null, "Group C", "ARG", "NGA", 2, 1, "NRG Stadium, Houston", ["FOX", "Telemundo"]],
  // Saturday, June 14
  ["wc-bra-cro", iso(2026, 5, 14, 19, 0), "IN_PLAY", 67, "Group F", "BRA", "CRO", 1, 1, "Mercedes-Benz Stadium, Atlanta", ["FOX", "Telemundo", "Globo"]],
  ["wc-esp-jpn-1", iso(2026, 5, 14, 23, 0), "TIMED", null, "Group F", "ESP", "JPN", null, null, "AT&T Stadium, Arlington", ["FS1", "Abema", "RTVE"]],
  ["wc-fra-kor", iso(2026, 5, 15, 2, 0), "TIMED", null, "Group C", "FRA", "KOR", null, null, "SoFi Stadium, Los Angeles", ["FOX", "TF1"]],
  ["wc-mex-ger-1", iso(2026, 5, 15, 2, 0), "TIMED", null, "Group A", "MEX", "GER", null, null, "Estadio Azteca, Mexico City", ["Telemundo", "ARD", "TUDN"]],
  // Sunday, June 15
  ["wc-arg-pol", iso(2026, 5, 15, 23, 0), "TIMED", null, "Group C", "ARG", "POL", null, null, "AT&T Stadium, Arlington", ["FOX", "TNT Sports", "Telefe"]],
  ["wc-nga-kor", iso(2026, 5, 16, 22, 0), "TIMED", null, "Group C", "NGA", "KOR", null, null, "Lincoln Financial Field, Philadelphia", ["FS1", "SSC"]],
  ["wc-cro-ksa", iso(2026, 5, 16, 23, 0), "TIMED", null, "Group A", "CRO", "KSA", null, null, "Hard Rock Stadium, Miami", ["Telemundo", "SSC"]],
  // Monday, June 16
  ["wc-bra-fra", iso(2026, 5, 17, 1, 0), "TIMED", null, "Group F", "BRA", "FRA", null, null, "MetLife Stadium, New Jersey", ["FOX", "TF1", "Globo"]],
  ["wc-esp-jpn-2", iso(2026, 5, 17, 2, 0), "TIMED", null, "Group F", "ESP", "JPN", null, null, "SoFi Stadium, Los Angeles", ["FS1", "ARD", "RTVE"]],
  ["wc-mex-ger-2", iso(2026, 5, 17, 2, 0), "TIMED", null, "Group A", "MEX", "GER", null, null, "Estadio Azteca, Mexico City", ["Telemundo", "TUDN"]],
];

function buildMatches(): Match[] {
  return MATCHES_RAW.map((r) => {
    const vz = venueZone(r[9]);
    return {
      id: r[0],
      utcDate: r[1],
      status: r[2],
      minute: r[3],
      matchday: 1,
      stage: "GROUP_STAGE",
      group: r[4],
      home: ref(r[5]),
      away: ref(r[6]),
      score: { home: r[7], away: r[8] },
      venue: r[9],
      venueZone: vz.zone,
      venueAbbr: vz.abbr,
      channels: r[10],
    };
  });
}

function buildNews(now: number): NewsItem[] {
  const ago = (mins: number) => new Date(now - mins * 60000).toISOString();
  return [
    { id: "n1", title: "Messi sets up Álvarez as Argentina edge Nigeria in opener", link: "https://www.bbc.com/sport/football", source: "BBC Sport", publishedAt: ago(120), snippet: "The captain's 68th-minute strike proved decisive after Osimhen had levelled from the spot in Houston.", teams: ["ARG", "NGA", "WC2026"] },
    { id: "n2", title: "Record heat advisory issued for Arlington and Houston fixtures", link: "https://www.theguardian.com/football", source: "The Guardian", publishedAt: ago(300), snippet: "Organisers brought in extra cooling breaks as temperatures climbed past 38°C across the southern host cities.", teams: ["WC2026"] },
    { id: "n3", title: "Semi-automated offside upgraded for the 48-team format", link: "https://www.theguardian.com/football", source: "The Guardian", publishedAt: ago(480), snippet: "FIFA confirmed an updated tracking system to handle the expanded schedule and tighter turnarounds.", teams: ["WC2026"] },
    { id: "n4", title: "Álvarez–Messi axis gives Scaloni a welcome selection headache", link: "https://www.bbc.com/sport/football", source: "BBC Sport", publishedAt: ago(160), snippet: "The pair combined for the opener and dictated the game's rhythm through the half-spaces.", teams: ["ARG", "WC2026"] },
    { id: "n5", title: "Spirited Nigeria pay for a slow start despite Osimhen penalty", link: "https://www.bbc.com/sport/football", source: "BBC Sport", publishedAt: ago(200), snippet: "The Super Eagles improved after the break but could not find a leveller.", teams: ["NGA", "WC2026"] },
    { id: "n6", title: "Brazil and Croatia locked level at the break in Atlanta", link: "https://www.theguardian.com/football", source: "The Guardian", publishedAt: ago(40), snippet: "An even Group F contest with chances at both ends as the second half gets underway.", teams: ["BRA", "CRO", "WC2026"] },
  ];
}

// Sample real-style (single-source) stats + timeline on the live match, so dev
// exercises the same path the API-Football merge produces in production.
function withSampleStats(matches: Match[]): Match[] {
  return matches.map((m) =>
    m.id === "wc-bra-cro"
      ? {
          ...m,
          stats: [
            { label: "Possession", home: 55, away: 45, unit: "%" },
            { label: "Total shots", home: 11, away: 7 },
            { label: "Shots on target", home: 4, away: 3 },
            { label: "Corners", home: 5, away: 2 },
            { label: "Fouls", home: 8, away: 11 },
            { label: "Yellow cards", home: 1, away: 2 },
          ],
          events: [
            { min: "23", type: "goal", teamCode: "BRA", player: "Vinícius Jr", detail: "Normal Goal" },
            { min: "41", type: "yellow", teamCode: "CRO", player: "Modrić", detail: "Yellow Card" },
            { min: "58", type: "goal", teamCode: "CRO", player: "Kramarić", detail: "Normal Goal" },
            { min: "63", type: "sub", teamCode: "BRA", player: "Rodrygo", detail: "Substitution" },
          ],
        }
      : m,
  );
}

export function getFixtureSnapshot(): Snapshot {
  const now = Date.now();
  return {
    lastUpdated: new Date(now - 90_000).toISOString(),
    competition: { name: "FIFA World Cup 2026", currentMatchday: 1, season: "2026" },
    teams: TEAM_CATALOG,
    groups: buildGroups(),
    matches: withSampleStats(buildMatches()),
    news: buildNews(now),
    profiles: PROFILES,
    meta: {
      matchesUpdated: new Date(now - 90_000).toISOString(),
      newsUpdated: new Date(now - 600_000).toISOString(),
      degraded: false,
    },
  };
}
