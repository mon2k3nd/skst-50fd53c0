import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: { id: Season; label: string; emoji: string }[] = [
  { id: "spring", label: "Xuân", emoji: "🌸" },
  { id: "summer", label: "Hạ", emoji: "☀️" },
  { id: "autumn", label: "Thu", emoji: "🍂" },
  { id: "winter", label: "Đông", emoji: "❄️" },
];

const STORAGE_KEY = "metrichub.season";

function defaultSeasonByMonth(): Season {
  const m = new Date().getMonth() + 1; // 1-12
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

interface Ctx {
  season: Season;
  setSeason: (s: Season) => void;
}

const SeasonCtx = createContext<Ctx | null>(null);

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeasonState] = useState<Season>("autumn");

  // Hydrate from localStorage / month default on mount
  useEffect(() => {
    try {
      const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Season | null;
      const initial: Season = stored && ["spring", "summer", "autumn", "winter"].includes(stored)
        ? stored
        : defaultSeasonByMonth();
      setSeasonState(initial);
    } catch {
      setSeasonState(defaultSeasonByMonth());
    }
  }, []);

  // Apply class to <html>
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    ["season-spring", "season-summer", "season-autumn", "season-winter"].forEach((c) =>
      html.classList.remove(c),
    );
    html.classList.add(`season-${season}`);
  }, [season]);

  const value = useMemo<Ctx>(
    () => ({
      season,
      setSeason: (s: Season) => {
        setSeasonState(s);
        try {
          localStorage.setItem(STORAGE_KEY, s);
        } catch {
          /* ignore */
        }
      },
    }),
    [season],
  );

  return <SeasonCtx.Provider value={value}>{children}</SeasonCtx.Provider>;
}

export function useSeason(): Ctx {
  const ctx = useContext(SeasonCtx);
  if (!ctx) {
    // Fallback to a no-op so SSR / outside-provider usage doesn't crash
    return { season: "autumn", setSeason: () => {} };
  }
  return ctx;
}