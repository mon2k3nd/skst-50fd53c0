import { useEffect, useState } from "react";

export function CreditBadge() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <a
      href="https://www.facebook.com/phd873"
      target="_blank"
      rel="noopener noreferrer"
      style={{ bottom: "calc(var(--footer-lift, 2.25rem) + 0.75rem)" }}
      className="fixed right-4 z-40 flex items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-1.5 text-xs font-semibold text-background shadow-lg backdrop-blur transition-all duration-500 hover:opacity-10 hover:scale-90 hover:pointer-events-none"
    >
      <span className="opacity-80">Edit With</span>
      <span className="text-warning">Phùng Hữu Đô</span>
    </a>
  );
}
