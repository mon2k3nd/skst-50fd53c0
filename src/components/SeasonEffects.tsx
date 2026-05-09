import { useMemo } from "react";
import { useSeason } from "@/lib/season";

/**
 * Full-screen seasonal particle overlay.
 * - spring: rơi cánh hoa đào 🌸
 * - summer: bong bóng / nắng biển ☀️
 * - autumn: lá vàng rơi 🍁
 * - winter: tuyết rơi ❄️
 */
export function SeasonEffects() {
  const { season } = useSeason();

  const config = useMemo(() => {
    switch (season) {
      case "spring":
        return { count: 28, glyphs: ["🌸", "🌺", "🏵️"], drift: 80, rotate: true };
      case "summer":
        return { count: 22, glyphs: ["☀️", "🌊", "🐚", "⭐"], drift: 30, rotate: false };
      case "autumn":
        return { count: 26, glyphs: ["🍁", "🍂", "🍃"], drift: 120, rotate: true };
      case "winter":
        return { count: 40, glyphs: ["❄", "❅", "❆", "•"], drift: 40, rotate: true };
    }
  }, [season]);

  const particles = useMemo(
    () =>
      Array.from({ length: config.count }).map((_, i) => {
        const left = Math.random() * 100;
        const dur = 8 + Math.random() * 10;
        const delay = -Math.random() * dur;
        const size = 12 + Math.random() * 18;
        const drift = (Math.random() * 2 - 1) * config.drift;
        const op = 0.55 + Math.random() * 0.45;
        const glyph = config.glyphs[i % config.glyphs.length];
        return { left, dur, delay, size, drift, op, glyph, key: `${season}-${i}` };
      }),
    [config, season]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      data-season-fx={season}
    >
      {/* Ambient sky glow per season */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background:
            season === "summer"
              ? "radial-gradient(60% 40% at 80% 10%, oklch(0.95 0.18 80 / 0.35), transparent 70%), linear-gradient(0deg, oklch(0.85 0.13 220 / 0.25), transparent 50%)"
              : season === "winter"
              ? "radial-gradient(80% 50% at 50% 0%, oklch(0.95 0.04 240 / 0.45), transparent 70%)"
              : season === "autumn"
              ? "radial-gradient(60% 40% at 20% 0%, oklch(0.85 0.18 50 / 0.35), transparent 70%)"
              : "radial-gradient(60% 40% at 50% 0%, oklch(0.92 0.1 350 / 0.3), transparent 70%)",
        }}
      />
      {particles.map((p) => (
        <span
          key={p.key}
          className="season-particle absolute -top-10 select-none"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            opacity: p.op,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            ["--drift" as never]: `${p.drift}px`,
            ["--rot" as never]: config.rotate ? "360deg" : "0deg",
          } as React.CSSProperties}
        >
          {p.glyph}
        </span>
      ))}
      {season === "summer" && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[oklch(0.7_0.15_220/0.35)] to-transparent" />
      )}
    </div>
  );
}
