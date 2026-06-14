import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "../types";
import { getFixtureSnapshot } from "./fixtures";

// Reads the cached snapshot from our own function (/api/data). The browser never
// calls third-party APIs directly. If the endpoint is missing (plain `vite dev`)
// or fails, we fall back to the bundled fixtures so the page never blanks.

const POLL_MS = 60_000;

export interface SnapshotState {
  data: Snapshot;
  /** True until the first network attempt resolves. */
  loading: boolean;
  /** True when we are showing fixtures because the live feed was unavailable. */
  usingFallback: boolean;
}

async function fetchSnapshot(signal: AbortSignal): Promise<Snapshot | null> {
  try {
    const res = await fetch("/api/data", { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as Snapshot;
    if (!json || !Array.isArray(json.matches)) return null;
    return json;
  } catch {
    return null;
  }
}

export function useSnapshot(): SnapshotState {
  const [state, setState] = useState<SnapshotState>(() => ({
    data: getFixtureSnapshot(),
    loading: true,
    usingFallback: true,
  }));
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();

    const load = async () => {
      const snap = await fetchSnapshot(controller.signal);
      if (!mounted.current) return;
      if (snap) {
        setState({ data: snap, loading: false, usingFallback: false });
      } else {
        // keep (or refresh) fixtures
        setState((s) => ({
          data: s.usingFallback ? getFixtureSnapshot() : s.data,
          loading: false,
          usingFallback: s.usingFallback,
        }));
      }
    };

    load();
    const t = window.setInterval(load, POLL_MS);
    return () => {
      mounted.current = false;
      controller.abort();
      window.clearInterval(t);
    };
  }, []);

  return state;
}
