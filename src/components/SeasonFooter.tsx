import { useEffect, useState } from "react";
import { SEASONS, useSeason } from "@/lib/season";
import { cn } from "@/lib/utils";

export function SeasonFooter() {
  const { season, setSeason } = useSeason();
  const [open, setOpen] = useState(false);
  const current = SEASONS.find((s) => s.id === season)!;

  // Push floating UI (chatbot, credit badge) up when footer expands
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--footer-lift", open ? "13rem" : "2.25rem");
  }, [open]);

  return (
    <>
      {/* Hover trigger zone at bottom of viewport */}
      <div
        className="fixed bottom-0 left-0 right-0 h-6 z-40"
        onMouseEnter={() => setOpen(true)}
      />
      <footer
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out",
          open ? "translate-y-0" : "translate-y-[calc(100%-2.25rem)]"
        )}
      >
        <div className="bg-card/95 backdrop-blur border-t shadow-card">
          <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Mùa hiện tại:</span>
            <span className="font-semibold text-foreground">{current.emoji} {current.label}</span>
            <span className="hidden sm:inline">— di chuột để chọn lại chủ đề</span>
          </div>
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEASONS.map((s) => {
              const active = s.id === season;
              return (
                <button
                  key={s.id}
                  onClick={() => setSeason(s.id)}
                  className={cn(
                    "group rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-card",
                    active ? "border-primary ring-2 ring-primary/40" : "border-border"
                  )}
                  data-season-preview={s.id}
                  style={
                    {
                      background:
                        s.id === "spring"
                          ? "linear-gradient(135deg, oklch(0.78 0.15 145), oklch(0.85 0.13 350))"
                          : s.id === "summer"
                          ? "linear-gradient(135deg, oklch(0.7 0.18 230), oklch(0.82 0.16 75))"
                          : s.id === "autumn"
                          ? "linear-gradient(135deg, oklch(0.7 0.18 45), oklch(0.6 0.2 20))"
                          : "linear-gradient(135deg, oklch(0.7 0.1 240), oklch(0.85 0.06 220))",
                    } as React.CSSProperties
                  }
                >
                  <div className="text-2xl">{s.emoji}</div>
                  <div className="text-sm font-bold text-white drop-shadow">{s.label}</div>
                  <div className="text-[11px] text-white/85">{s.tagline}</div>
                </button>
              );
            })}
          </div>
          <div className="text-center text-[11px] text-muted-foreground pb-2">
            MetricHub © {new Date().getFullYear()} — Phùng Hữu Đô
          </div>
        </div>
      </footer>
    </>
  );
}
