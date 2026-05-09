import { useState } from "react";
import { useSeason, SEASONS, type Season } from "@/contexts/SeasonContext";
import { ChevronUp } from "lucide-react";

export function Footer() {
  const { season, setSeason } = useSeason();
  const [pinned, setPinned] = useState(false);

  return (
    <footer
      className={`season-footer ${pinned ? "is-open" : ""}`}
      aria-label="Chọn chủ đề theo mùa"
    >
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        className="season-footer-handle flex w-full items-center justify-center gap-2 text-xs font-semibold text-white"
        aria-label="Mở bảng chọn mùa"
      >
        <ChevronUp className="h-3 w-3" />
        <span className="opacity-90">Chủ đề theo mùa</span>
        <ChevronUp className="h-3 w-3" />
      </button>
      <div className="border-t bg-card/95 backdrop-blur shadow-[var(--shadow-elevated)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">MetricHub</span> · Real-time Data, Real-time Success
          </div>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map((s) => {
              const active = s.id === season;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeason(s.id as Season)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-card)] scale-105"
                      : "border-border bg-background text-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground"
                  }`}
                  aria-pressed={active}
                >
                  <span aria-hidden>{s.emoji}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}