// Rich per-match content for the Match Center tabs (Stats / Summary / News /
// Analysis / Video). football-data.org's free tier provides NONE of this
// (no possession, xG, multi-source comparison, timelines, or media), so this is
// mock content that demonstrates the designed UI for the showcase fixture only.
// Every other match returns null → the Match Center shows graceful empty states,
// keeping the app honest about what the live feed can actually supply.

export interface SourceVal {
  name: string;
  home: string;
  away: string;
}

export interface StatRow {
  label: string;
  home: number;
  away: number;
  unit?: string;
  dec?: boolean;
  emphasize?: boolean;
  sources?: SourceVal[];
}

export type EventType = "goal" | "pen" | "yellow" | "red" | "sub" | "ft";

export interface TimelineEvent {
  min: string;
  type: EventType;
  team: string | null;
  main: string;
  sub: string;
}

export interface AnalysisCard {
  author: string;
  title: string;
  body: string;
  stat: string;
  statLabel: string;
}

export interface Clip {
  title: string;
  dur: string;
  tag: string;
}

export interface MatchDetail {
  stats: StatRow[];
  events: TimelineEvent[];
  analysis: AnalysisCard[];
  clips: Clip[];
}

const ARG_NGA: MatchDetail = {
  stats: [
    { label: "Possession", home: 58, away: 42, unit: "%", sources: [{ name: "Opta", home: "57%", away: "43%" }, { name: "StatsBomb", home: "58%", away: "42%" }, { name: "FotMob", home: "59%", away: "41%" }] },
    { label: "Total shots", home: 15, away: 9, sources: [{ name: "Opta", home: "15", away: "9" }, { name: "StatsBomb", home: "15", away: "8" }, { name: "FotMob", home: "16", away: "9" }] },
    { label: "Shots on target", home: 6, away: 4 },
    { label: "Expected goals (xG)", home: 2.31, away: 1.08, dec: true, emphasize: true, sources: [{ name: "Opta", home: "2.31", away: "1.08" }, { name: "StatsBomb", home: "2.28", away: "1.14" }, { name: "FotMob", home: "2.40", away: "1.02" }] },
    { label: "Big chances", home: 4, away: 2 },
    { label: "Passes", home: 612, away: 441 },
    { label: "Pass accuracy", home: 88, away: 81, unit: "%" },
    { label: "Expected threat (xT)", home: 1.82, away: 0.91, dec: true, emphasize: true, sources: [{ name: "Opta", home: "1.82", away: "0.91" }, { name: "StatsBomb", home: "1.76", away: "0.95" }] },
    { label: "Corners", home: 7, away: 3 },
    { label: "Fouls", home: 9, away: 14 },
    { label: "Tackles won", home: 14, away: 19 },
    { label: "Yellow cards", home: 1, away: 3 },
  ],
  events: [
    { min: "12", type: "goal", team: "ARG", main: "Julián Álvarez", sub: "Assist · Mac Allister" },
    { min: "34", type: "yellow", team: "NGA", main: "W. Ndidi", sub: "Foul on De Paul" },
    { min: "51", type: "pen", team: "NGA", main: "V. Osimhen", sub: "Penalty · VAR awarded" },
    { min: "68", type: "goal", team: "ARG", main: "Lionel Messi", sub: "Free-kick · Assist none" },
    { min: "79", type: "sub", team: "ARG", main: "Á. Di María", sub: "Off · Nico Paz on" },
    { min: "88", type: "yellow", team: "NGA", main: "C. Bassey", sub: "Tactical foul" },
    { min: "90+3", type: "ft", team: null, main: "Full time", sub: "Argentina 2 – 1 Nigeria" },
  ],
  analysis: [
    { author: "TACTICS DESK", title: "How Argentina owned the half-spaces", body: "Scaloni's 4-3-3 pinned Nigeria's full-backs deep, letting Mac Allister and De Paul rotate into the pockets between the lines. Four big chances came from central overloads.", stat: "2.31", statLabel: "open-play xG created" },
    { author: "SET-PIECE WATCH", title: "The routine that broke the deadlock", body: "A worked short free-kick dragged two markers away before Messi's strike. Nigeria, by contrast, generated just 0.4 xG from all set pieces.", stat: "68'", statLabel: "the winning goal" },
  ],
  clips: [
    { title: "Álvarez opens the scoring", dur: "0:38", tag: "GOAL" },
    { title: "Osimhen levels from the spot", dur: "0:41", tag: "GOAL" },
    { title: "Messi's winning free-kick", dur: "0:52", tag: "GOAL" },
    { title: "Extended highlights", dur: "3:12", tag: "HIGHLIGHTS" },
  ],
};

const DETAILS: Record<string, MatchDetail> = {
  "wc-arg-nga": ARG_NGA,
};

export function getMatchDetail(id: string): MatchDetail | null {
  return DETAILS[id] ?? null;
}
