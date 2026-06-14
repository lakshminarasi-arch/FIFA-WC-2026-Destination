import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_TZ, detectTz } from "../lib/time";

export type Screen = "today" | "team" | "match" | "sched";
export type Overlay = "tz" | "team" | null;

interface AppState {
  screen: Screen;
  go: (s: Screen) => void;
  /** Favorite team code (single, per the design). Drives highlighting + My Team. */
  fav: string;
  setFav: (code: string) => void;
  /** Selected IANA timezone for all "your time" renders. */
  tz: string;
  setTz: (id: string) => void;
  /** Epoch ms, ticking every second, for live clocks + day countdowns. */
  now: number;
  /** Which overlay is open. */
  menu: Overlay;
  setMenu: (m: Overlay) => void;
  /** Match id shown in the Match Center. */
  selectedMatchId: string | null;
  openMatch: (id: string) => void;
}

const Ctx = createContext<AppState | null>(null);

const LS_FAV = "tl_fav";
const LS_TZ = "tl_tz";

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore (private mode / disabled storage) */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("today");
  const [fav, setFavState] = useState<string>(() => readLS(LS_FAV) ?? "ARG");
  const [tz, setTzState] = useState<string>(
    () => readLS(LS_TZ) ?? detectTz() ?? DEFAULT_TZ,
  );
  const [now, setNow] = useState<number>(() => Date.now());
  const [menu, setMenu] = useState<Overlay>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    setMenu(null);
    // Scroll the content area to top on navigation.
    requestAnimationFrame(() => {
      document.getElementById("tl-scroll")?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    });
  }, []);

  const setFav = useCallback((code: string) => {
    setFavState(code);
    writeLS(LS_FAV, code);
  }, []);

  const setTz = useCallback((id: string) => {
    setTzState(id);
    writeLS(LS_TZ, id);
  }, []);

  const openMatch = useCallback(
    (id: string) => {
      setSelectedMatchId(id);
      go("match");
    },
    [go],
  );

  const value = useMemo<AppState>(
    () => ({
      screen,
      go,
      fav,
      setFav,
      tz,
      setTz,
      now,
      menu,
      setMenu,
      selectedMatchId,
      openMatch,
    }),
    [screen, go, fav, setFav, tz, setTz, now, menu, selectedMatchId, openMatch],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
