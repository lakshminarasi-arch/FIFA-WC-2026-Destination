import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "../../src/types";
import { TEAM_CATALOG } from "../../src/lib/catalog";

// Scheduled: pulls trusted football RSS feeds, parses, merges, dedupes and tags
// each item with detected team codes + "WC2026". HARD RULE: we store only the
// headline, source, timestamp and the short feed snippet — never full article
// text — and always link out to the original. On failure we keep the last blob.

// Single config array so sources are easy to add/remove. BBC + Guardian are
// known-good; Sky + ESPN paths shift, so they're validated (and dropped) at run.
const FEEDS: Array<{ source: string; url: string }> = [
  { source: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml" },
  { source: "The Guardian", url: "https://www.theguardian.com/football/rss" },
  // Confirm these before relying on them — validated per-run, dropped if not XML.
  { source: "Sky Sports", url: "https://www.skysports.com/rss/12040" },
  { source: "ESPN Soccer", url: "https://www.espn.com/espn/rss/soccer/news" },
];

// Map team display names → 3-letter code for tagging.
const NAME_TO_CODE: Array<[string, string]> = Object.values(TEAM_CATALOG).map(
  (t) => [t.name.toLowerCase(), t.code],
);

function detectTeams(text: string): string[] {
  const lc = text.toLowerCase();
  const out = new Set<string>();
  for (const [name, code] of NAME_TO_CODE) {
    if (lc.includes(name)) out.add(code);
  }
  if (lc.includes("world cup")) out.add("WC2026");
  return [...out];
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

interface RssItemRaw {
  title?: string | { "#text"?: string };
  link?: string | { "@_href"?: string } | Array<string | { "@_href"?: string }>;
  description?: string;
  summary?: string;
  pubDate?: string;
  published?: string;
  updated?: string;
  guid?: string | { "#text"?: string };
}

function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "#text" in v) return String((v as { "#text"?: string })["#text"] ?? "");
  return "";
}

function extractLink(link: RssItemRaw["link"]): string {
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    for (const l of link) {
      if (typeof l === "string") return l;
      if (l && l["@_href"]) return l["@_href"];
    }
  }
  if (link && typeof link === "object" && "@_href" in link) return link["@_href"] ?? "";
  return "";
}

async function fetchFeed(source: string, url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "TouchlineWC2026/1.0 (+netlify)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    if (!/<(rss|feed)[\s>]/i.test(xml)) throw new Error("not XML/RSS");

    const obj = parser.parse(xml);
    const rawItems: RssItemRaw[] = obj?.rss?.channel?.item ?? obj?.feed?.entry ?? [];
    const list = Array.isArray(rawItems) ? rawItems : [rawItems];

    return list
      .map((it, i): NewsItem | null => {
        const title = asText(it.title).trim();
        const link = extractLink(it.link);
        if (!title || !link) return null;
        const snippet = stripHtml(it.description ?? it.summary ?? "");
        const dateStr = it.pubDate || it.published || it.updated || "";
        const publishedAt = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
        const id = asText(it.guid) || link || `${source}-${i}`;
        return {
          id,
          title,
          link,
          source,
          publishedAt,
          snippet,
          teams: detectTeams(`${title} ${snippet}`),
        };
      })
      .filter((x): x is NewsItem => x !== null);
  } catch (err) {
    console.warn(`[fetch-news] dropping feed ${source} (${url}):`, String(err));
    return [];
  }
}

export async function runNews(): Promise<Record<string, unknown>> {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f.source, f.url)));
  const merged = results.flat();

  if (merged.length === 0) {
    // Nothing parsed — keep the last good blob.
    return { ok: false, items: 0 };
  }

  // Dedupe by link, sort newest first, cap.
  const seen = new Set<string>();
  const deduped = merged
    .filter((n) => {
      const key = n.link;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 60);

  const store = getStore("touchline");
  await store.setJSON("news", { updatedAt: new Date().toISOString(), items: deduped });

  return { ok: true, items: deduped.length };
}

export default async (): Promise<Response> => {
  const result = await runNews();
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  schedule: "*/20 * * * *",
};
