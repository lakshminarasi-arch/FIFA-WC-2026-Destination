// Design tokens — transcribed verbatim from the Touchline handoff. These are
// final and intentional; do not tweak without a design change.

export const color = {
  // neutrals
  paper: "#EFEFEA",
  surface: "#FFFFFF",
  ink: "#16181D",
  slate: "#5B6068",
  muted: "#8A9099",
  hairline: "#E6E6E1",
  tile: "#FAFAF8",
  tileBorder: "#EEEEE9",
  rowDivider: "#F0F0EB",
  faint: "#A6ABB2",
  disabledScore: "#C2C6CC",
  upcomingConnector: "#D7DBE3",

  // accent & semantic
  accent: "#2B57FF",
  accentTint: "#EEF1FF",
  accentTintBorder: "#DCE2FF",
  win: "#0FA958",
  caution: "#E8920C",
  cardAmber: "#E8B007",
  negative: "#E5484D",
  liveDot: "#FF4D4D",
  liveText: "#FF6B6B",
  advTint: "#F4F2FF",
  advTintBorder: "#E6E1FF",

  // dark-card greys
  darkMuted: "#9CA0A8",
  darkFaint: "#787D85",
} as const;

export const font = {
  display: "'Space Grotesk',sans-serif",
  ui: "'Hanken Grotesk',sans-serif",
  mono: "'IBM Plex Mono',monospace",
} as const;

export const shadow = {
  card: "0 1px 2px rgba(20,22,29,.04)",
  popover: "0 12px 34px rgba(20,22,29,.16)",
  modal: "0 24px 60px rgba(0,0,0,.3)",
} as const;

export const radius = {
  sm: 8,
  chip: 12,
  smallCard: 14,
  card: 18,
  pill: 999,
} as const;
