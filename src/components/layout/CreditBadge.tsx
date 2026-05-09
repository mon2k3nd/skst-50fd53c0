import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useSeason } from "@/lib/season";

const seasonAccent: Record<string, string> = {
  spring: "🌸",
  summer: "☀️",
  autumn: "🍁",
  winter: "❄️",
};

export function CreditBadge() {
  const [mounted, setMounted] = useState(false);
  const { season } = useSeason();
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <a
      href="https://www.facebook.com/phd873"
      target="_blank"
      rel="noopener noreferrer"
      style={{ bottom: "calc(var(--footer-lift, 2.25rem) + 0.75rem)" }}
      className="group fixed right-4 z-40 flex items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-xs font-bold shadow-card backdrop-blur-md transition-all duration-500 hover:scale-105 hover:shadow-lg"
      style={{
        bottom: "calc(var(--footer-lift, 2.25rem) + 0.75rem)",
        background: "var(--gradient-header)",
        color: "var(--brand-foreground)",
        border: "1px solid oklch(1 0 0 / 0.25)",
      }}
    >
      <span className="badge-shine absolute inset-0 rounded-full" />
      <Sparkles className="relative h-3.5 w-3.5 animate-float" />
      <span className="relative opacity-90">Edit With</span>
      <span className="relative font-extrabold tracking-wide" style={{ color: "oklch(0.95 0.15 90)" }}>
        Phùng Hữu Đô
      </span>
      <span className="relative text-sm leading-none">{seasonAccent[season]}</span>
    </a>
  );
}
