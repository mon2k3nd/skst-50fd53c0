import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: { id: Season; label: string; emoji: string; tagline: string }[] = [
  { id: "spring", label: "Xuân", emoji: "🌸", tagline: "Tươi mới, khởi sắc" },
  { id: "summer", label: "Hạ", emoji: "☀️", tagline: "Rực rỡ, năng lượng" },
  { id: "autumn", label: "Thu", emoji: "🍁", tagline: "Ấm áp, thu hoạch" },
  { id: "winter", label: "Đông", emoji: "❄️", tagline: "Tinh khôi, bình yên" },
];

type Ctx = { season: Season; setSeason: (s: Season) => void };
const SeasonCtx = createContext<Ctx>({ season: "spring", setSeason: () => {} });

const KEY = "metrichub.season";

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [season, setSeasonState] = useState<Season>("spring");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(KEY)) as Season | null;
    if (saved && ["spring", "summer", "autumn", "winter"].includes(saved)) {
      setSeasonState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-season", season);
    }
  }, [season]);

  const setSeason = (s: Season) => {
    setSeasonState(s);
    try { localStorage.setItem(KEY, s); } catch {}
  };

  return <SeasonCtx.Provider value={{ season, setSeason }}>{children}</SeasonCtx.Provider>;
}

export const useSeason = () => useContext(SeasonCtx);
