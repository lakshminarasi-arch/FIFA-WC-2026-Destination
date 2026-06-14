import type { CSSProperties } from "react";
import type { FlagDir, Team } from "../types";

// Flags are rendered as simple CSS gradient colour bands (a placeholder per the
// handoff), NOT real flag artwork. `flagStyle` fills its parent swatch.
export function flagStyle(raw: Array<string | null | undefined>, dir: FlagDir = "v"): CSSProperties {
  const d = dir === "h" ? "180deg" : "90deg";
  // Drop any nullish band so a malformed colour can't break the whole gradient.
  const cols = raw.filter((c): c is string => !!c);
  if (cols.length === 0) cols.push("#8A9099");
  const n = cols.length;
  const stops = cols
    .map(
      (c, i) =>
        `${c} ${((i / n) * 100).toFixed(2)}% ${(((i + 1) / n) * 100).toFixed(2)}%`,
    )
    .join(", ");
  return {
    backgroundImage: `linear-gradient(${d}, ${stops})`,
    backgroundColor: cols[0] ?? "#888",
    width: "100%",
    height: "100%",
  };
}

// Deterministic fallback bands for teams we have no curated palette for (so any
// of the 48 nations from a live feed still renders a stable swatch).
const FALLBACK_PALETTE = [
  "#2B57FF",
  "#0FA958",
  "#E8920C",
  "#E5484D",
  "#16181D",
  "#74ACDF",
  "#AA151B",
  "#003478",
  "#FEDF00",
  "#006847",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function fallbackTeam(code: string, name?: string): Team {
  const h = hash(code || name || "team");
  // Unsigned shift: `>>` would go negative for h >= 2^31, yielding a negative
  // index and an undefined (→ null) colour band.
  const a = FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
  const b = FALLBACK_PALETTE[(h >>> 8) % FALLBACK_PALETTE.length];
  return {
    code,
    name: name || code,
    flag: [a, "#FFFFFF", b],
    flagDir: h & 1 ? "h" : "v",
  };
}

export function styleForTeam(
  teams: Record<string, Team>,
  code: string | undefined | null,
): CSSProperties {
  if (!code) return flagStyle(["#D7DBE3", "#EEEEE9"], "v");
  const t = teams[code] ?? fallbackTeam(code);
  return flagStyle(t.flag, t.flagDir);
}

export function teamName(
  teams: Record<string, Team>,
  code: string | undefined | null,
): string {
  if (!code) return "—";
  return teams[code]?.name ?? code;
}
