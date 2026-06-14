// Time computation. Every kickoff is a UTC instant; "your time" = format in the
// selected zone, "venue time" = format in the venue's zone. Uses Intl with an
// explicit timeZone (en-GB 24h for clocks, en-US month/day for dates), matching
// the handoff prototype.

export interface TzOption {
  id: string; // IANA id
  abbr: string;
  city: string;
}

export const TZ_OPTIONS: TzOption[] = [
  { id: "Asia/Kolkata", abbr: "IST", city: "India · Mumbai" },
  { id: "Europe/London", abbr: "BST", city: "United Kingdom" },
  { id: "Europe/Paris", abbr: "CEST", city: "Central Europe" },
  { id: "America/New_York", abbr: "ET", city: "US · Eastern" },
  { id: "America/Chicago", abbr: "CT", city: "US · Central" },
  { id: "America/Los_Angeles", abbr: "PT", city: "US · Pacific" },
  { id: "America/Sao_Paulo", abbr: "BRT", city: "Brazil" },
  { id: "Asia/Dubai", abbr: "GST", city: "Gulf · UAE" },
  { id: "Asia/Tokyo", abbr: "JST", city: "Japan / Korea" },
  { id: "Australia/Sydney", abbr: "AET", city: "Australia" },
];

export const DEFAULT_TZ = "Asia/Kolkata"; // IST — primary audience is in India.

export function tzInfo(id: string): TzOption {
  return TZ_OPTIONS.find((z) => z.id === id) ?? TZ_OPTIONS[0];
}

/** Detect the visitor's IANA zone, falling back to IST. Only returns a value
 *  we offer in the switcher so the UI stays consistent. */
export function detectTz(): string {
  try {
    const z = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (z && TZ_OPTIONS.some((o) => o.id === z)) return z;
    // map a few common unlisted zones onto our offered set
    if (z?.startsWith("America/")) return "America/New_York";
    if (z?.startsWith("Europe/")) return "Europe/London";
    if (z?.startsWith("Asia/")) return "Asia/Kolkata";
    return DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
}

export function clock(now: number, zone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zone,
  }).format(now);
}

export interface Formatted {
  date: string; // "Jun 16"
  time: string; // "05:30"
  full: string; // "Jun 16 · 05:30"
}

export function fmt(ms: number | string, zone: string): Formatted {
  const t = typeof ms === "string" ? Date.parse(ms) : ms;
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: zone,
  }).format(t);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zone,
  }).format(t);
  return { date, time, full: `${date} · ${time}` };
}

/** Weekday + date label for schedule day groups, e.g. "SATURDAY, JUNE 14". */
export function dayLabel(ms: number | string, zone: string): string {
  const t = typeof ms === "string" ? Date.parse(ms) : ms;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: zone,
  })
    .format(t)
    .toUpperCase();
}

/** "TODAY" / "TOMORROW" / "IN N DAYS" countdown to a kickoff. */
export function daysTo(ms: number | string, now: number): string {
  const t = typeof ms === "string" ? Date.parse(ms) : ms;
  const d = Math.round((t - now) / 86_400_000);
  if (d <= 0) return "TODAY";
  if (d === 1) return "TOMORROW";
  return `IN ${d} DAYS`;
}

/** YYYY-MM-DD key in a given zone, for grouping fixtures by local day. */
export function dayKey(ms: number | string, zone: string): string {
  const t = typeof ms === "string" ? Date.parse(ms) : ms;
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: zone,
  }).format(t);
  return parts; // en-CA gives YYYY-MM-DD
}

export function relativeTime(iso: string, now: number): string {
  const diff = now - Date.parse(iso);
  if (Number.isNaN(diff)) return "";
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}
