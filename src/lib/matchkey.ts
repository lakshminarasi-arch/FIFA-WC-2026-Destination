// Cross-provider match key. football-data.org and API-Football name countries
// slightly differently, so we normalise team names to a canonical token and key
// a match by the (order-independent) team pair + UTC day. Both the stats fetcher
// (API-Football side) and get-data (football-data side) compute the same key so
// stats can be attached to the right fixture without sharing an ID space.

// Canonical aliases for the names that differ between providers. Extend as
// mismatches surface in production logs.
const ALIASES: Record<string, string> = {
  "korea republic": "southkorea",
  "south korea": "southkorea",
  "korea dpr": "northkorea",
  "north korea": "northkorea",
  "ir iran": "iran",
  "iran islamic republic": "iran",
  "usa": "unitedstates",
  "united states": "unitedstates",
  "united states of america": "unitedstates",
  "czech republic": "czechia",
  "cote d ivoire": "ivorycoast",
  "côte d'ivoire": "ivorycoast",
  "ivory coast": "ivorycoast",
  "cabo verde": "capeverde",
  "cape verde": "capeverde",
  "bosnia and herzegovina": "bosnia",
  "bosnia herzegovina": "bosnia",
  "republic of ireland": "ireland",
  "dr congo": "congodr",
  "congo dr": "congodr",
  "turkiye": "turkey",
  "türkiye": "turkey",
  "curacao": "curacao",
  "curaçao": "curacao",
};

export function normalizeCountry(name: string | null | undefined): string {
  if (!name) return "";
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (ALIASES[base]) return ALIASES[base];
  const compact = base.replace(/ /g, "");
  return ALIASES[base] ?? compact;
}

/** YYYY-MM-DD in UTC. */
function utcDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Order-independent key: sorted normalised names + UTC day. */
export function matchKey(homeName: string, awayName: string, iso: string): string {
  const a = normalizeCountry(homeName);
  const b = normalizeCountry(awayName);
  const [x, y] = [a, b].sort();
  return `${x}|${y}|${utcDay(iso)}`;
}
