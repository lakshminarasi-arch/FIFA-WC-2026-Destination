import type { Team } from "../types";

// Curated flag palettes (CSS colour bands — placeholders, not real flag art).
// Shared by the bundled fixtures and the live data transform so the same teams
// always look identical. Unknown teams fall back to a deterministic palette
// (see flags.ts → fallbackTeam).
export const TEAM_CATALOG: Record<string, Team> = {
  ARG: { code: "ARG", name: "Argentina", flag: ["#74ACDF", "#FFFFFF", "#74ACDF"], flagDir: "h" },
  NGA: { code: "NGA", name: "Nigeria", flag: ["#008751", "#FFFFFF", "#008751"], flagDir: "v" },
  POL: { code: "POL", name: "Poland", flag: ["#FFFFFF", "#DC143C"], flagDir: "h" },
  KSA: { code: "KSA", name: "Saudi Arabia", flag: ["#FFFFFF", "#006C35"], flagDir: "h" },
  BRA: { code: "BRA", name: "Brazil", flag: ["#009B3A", "#FEDF00", "#002776"], flagDir: "v" },
  CRO: { code: "CRO", name: "Croatia", flag: ["#FF0000", "#FFFFFF", "#171796"], flagDir: "h" },
  ESP: { code: "ESP", name: "Spain", flag: ["#AA151B", "#F1BF00", "#AA151B"], flagDir: "h" },
  JPN: { code: "JPN", name: "Japan", flag: ["#FFFFFF", "#BC002D", "#FFFFFF"], flagDir: "v" },
  FRA: { code: "FRA", name: "France", flag: ["#0055A4", "#FFFFFF", "#EF4135"], flagDir: "v" },
  KOR: { code: "KOR", name: "South Korea", flag: ["#FFFFFF", "#003478"], flagDir: "h" },
  MEX: { code: "MEX", name: "Mexico", flag: ["#006847", "#FFFFFF", "#CE1126"], flagDir: "v" },
  GER: { code: "GER", name: "Germany", flag: ["#000000", "#DD0000", "#FFCE00"], flagDir: "h" },
  // host nations (USA, Canada) for completeness
  USA: { code: "USA", name: "United States", flag: ["#B22234", "#FFFFFF", "#3C3B6E"], flagDir: "v" },
  CAN: { code: "CAN", name: "Canada", flag: ["#FF0000", "#FFFFFF", "#FF0000"], flagDir: "h" },
};
