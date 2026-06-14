# Touchline — FIFA World Cup 2026 Tracker

A destination web app for following the FIFA World Cup 2026 (USA · Canada ·
Mexico, 48 teams): live-delayed scores, group tables, your team's journey,
fixtures with global telecast timing, and an aggregated football-news rail.

The UI is a faithful build of the **Touchline** design handoff (Claude Design).
This repo adds the data layer, the integration, and the wiring of real data into
those screens.

## How it works

- **Frontend** — Vite + React + TypeScript (`src/`). The browser reads **only**
  cached JSON from our own endpoint `/api/data`; it never calls third-party APIs.
- **Data layer** — Netlify Scheduled Functions (`netlify/functions/`) fetch from
  upstream on a cron, normalise to one snapshot shape (`src/types.ts`), and cache
  to **Netlify Blobs**. One upstream fetch serves every visitor (free-tier safe).
  - `fetch-matches` — football-data.org → matches, standings, teams (every 2 min)
  - `fetch-news` — trusted football RSS → tagged headlines (every 20 min)
  - `get-data` — assembles the cached blobs into the snapshot at `/api/data`
- **Resilience** — on upstream failure the last good blob keeps serving; if no
  blob exists yet (or running plain `vite dev`), the app falls back to bundled
  fixtures so the page never blanks.

### Honest about the data
football-data.org's free tier gives delayed scores, standings and teams — **no**
real-time minutes, xG/xT, or multi-source stats. The Match Center keeps the
designed Stats / Summary / Analysis / Video UI but **empty-states** anything the
feed can't supply (only the showcase fixture has demo content). No "live"
promises, no fabricated numbers.

## Screens
Today (dashboard) · My Team (journey) · Match Center (per-match tabs) · Schedule
(global telecast timing). Fully responsive: a sticky bottom tab bar replaces the
sidebar on mobile. Favourite team + timezone persist in `localStorage`.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173 — uses bundled fixtures
npm run build      # typecheck + production build to dist/
npm run typecheck
```

To run the Netlify functions locally (needs the Netlify CLI + an API key):

```bash
cp .env.example .env      # add FOOTBALL_DATA_API_KEY
npm run netlify:dev
```

## Deploy (Netlify)
1. Connect this repo in Netlify (build is configured in `netlify.toml`).
2. Set the env var **`FOOTBALL_DATA_API_KEY`** (football-data.org token).
3. Deploy. Scheduled functions begin populating Netlify Blobs; the frontend
   switches from fixtures to live data automatically.

## Credits
- Match data: [football-data.org](https://www.football-data.org) (free tier;
  non-commercial use + attribution).
- News: headlines link out to BBC Sport, The Guardian and other sources — only
  headline, source, timestamp and the short feed snippet are shown; full article
  text stays with the publisher.
