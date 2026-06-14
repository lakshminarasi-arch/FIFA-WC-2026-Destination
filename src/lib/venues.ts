// World Cup 2026 venues span US / Canada / Mexico time zones. football-data only
// gives us a venue string, so we map known venues → IANA zone + short abbr to
// drive the dual "your time / venue time" display. Unknown venues default to ET.

interface VenueInfo {
  zone: string;
  abbr: string;
}

const ZONE_ABBR: Record<string, string> = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Los_Angeles": "PT",
  "America/Denver": "MT",
  "America/Mexico_City": "CST",
  "America/Toronto": "ET",
  "America/Vancouver": "PT",
};

// Keyed by lowercased substrings found in venue / city names.
const VENUE_ZONES: Array<[string, string]> = [
  ["atlanta", "America/New_York"],
  ["mercedes-benz", "America/New_York"],
  ["new jersey", "America/New_York"],
  ["metlife", "America/New_York"],
  ["philadelphia", "America/New_York"],
  ["lincoln financial", "America/New_York"],
  ["miami", "America/New_York"],
  ["hard rock", "America/New_York"],
  ["boston", "America/New_York"],
  ["gillette", "America/New_York"],
  ["foxborough", "America/New_York"],
  ["toronto", "America/Toronto"],
  ["bmo field", "America/Toronto"],
  ["houston", "America/Chicago"],
  ["nrg", "America/Chicago"],
  ["dallas", "America/Chicago"],
  ["arlington", "America/Chicago"],
  ["at&t stadium", "America/Chicago"],
  ["kansas city", "America/Chicago"],
  ["arrowhead", "America/Chicago"],
  ["los angeles", "America/Los_Angeles"],
  ["sofi", "America/Los_Angeles"],
  ["san francisco", "America/Los_Angeles"],
  ["bay area", "America/Los_Angeles"],
  ["levi's", "America/Los_Angeles"],
  ["santa clara", "America/Los_Angeles"],
  ["seattle", "America/Los_Angeles"],
  ["lumen", "America/Los_Angeles"],
  ["vancouver", "America/Vancouver"],
  ["bc place", "America/Vancouver"],
  ["mexico city", "America/Mexico_City"],
  ["azteca", "America/Mexico_City"],
  ["guadalajara", "America/Mexico_City"],
  ["monterrey", "America/Monterrey"],
];

export function zoneAbbr(zone: string): string {
  return ZONE_ABBR[zone] ?? "ET";
}

export function venueZone(venue: string | null | undefined): VenueInfo {
  const v = (venue ?? "").toLowerCase();
  for (const [needle, zone] of VENUE_ZONES) {
    if (v.includes(needle)) return { zone, abbr: zoneAbbr(zone) };
  }
  return { zone: "America/New_York", abbr: "ET" };
}
