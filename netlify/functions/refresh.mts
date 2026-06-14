import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { runMatches } from "./fetch-matches.mts";
import { runNews } from "./fetch-news.mts";
import { runStats } from "./fetch-stats.mts";

// On-demand refresh + diagnostics at /api/refresh. Triggers the same fetch logic
// the scheduled functions run and returns a JSON report — so you can verify keys
// and the data pipeline in seconds instead of waiting for the cron.
//
// Guards (this hits rate-limited upstreams):
//  - Optional shared secret: if REFRESH_TOKEN is set, require ?token=... to match.
//  - Cooldown: at most one refresh per COOLDOWN_MS, to prevent hammering.

const COOLDOWN_MS = 20_000;

export default async (req: Request): Promise<Response> => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });

  // Optional token gate.
  const required = process.env.REFRESH_TOKEN;
  if (required) {
    const token = new URL(req.url).searchParams.get("token");
    if (token !== required) return json({ ok: false, error: "unauthorized" }, 401);
  }

  // Cooldown.
  const store = getStore("touchline");
  const meta = (await store.get("refresh_meta", { type: "json" })) as { lastAt?: string } | null;
  const last = meta?.lastAt ? Date.parse(meta.lastAt) : 0;
  const sinceMs = Date.now() - last;
  if (sinceMs < COOLDOWN_MS) {
    return json({ ok: false, error: "cooldown", retryInMs: COOLDOWN_MS - sinceMs }, 429);
  }
  await store.setJSON("refresh_meta", { lastAt: new Date().toISOString() });

  // Run all three. Each is internally fail-safe (keeps last good blob).
  const [matches, news, stats] = await Promise.all([runMatches(), runNews(), runStats()]);

  return json({ ok: true, ranAt: new Date().toISOString(), matches, news, stats });
};

export const config: Config = {
  path: "/api/refresh",
};
