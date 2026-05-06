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
      className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-1.5 text-xs font-semibold text-background shadow-lg backdrop-blur transition-transform hover:scale-105 hover:bg-foreground"
    >
      <span className="opacity-80">Edit With</span>
      <span className="text-warning">Phùng Hữu Đô</span>
    </a>
  );
}