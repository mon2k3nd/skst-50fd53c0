import { Link } from "@tanstack/react-router";
import { Home, Store, Trophy, BarChart3, Users } from "lucide-react";
import logoMwg from "@/assets/logo-mwg.webp";
import { useSeason, SEASONS } from "@/lib/season";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 13) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/doanh-thu", label: "Doanh Thu", icon: Store },
  { to: "/thi-dua", label: "Thi Đua", icon: Trophy },
  { to: "/luy-ke", label: "Luỹ Kế", icon: BarChart3 },
  { to: "/nhan-vien", label: "Nhân Viên", icon: Users },
] as const;

export function SiteHeader() {
  const { season } = useSeason();
  const cur = SEASONS.find((s) => s.id === season)!;
  return (
    <header className="bg-gradient-header text-white sticky top-0 z-40 shadow-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <Link to="/" className="flex items-center gap-2.5 leading-tight">
          <img
            src={logoMwg}
            alt="MetricHub logo"
            className="h-10 w-10 rounded-full bg-white/10 ring-2 ring-white/30 shadow-card object-contain"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold tracking-tight">
              <span style={{ color: "#FFD600" }}>Metric</span>
              <span className="text-white">Hub</span>
            </span>
            <span className="text-[11px] sm:text-xs text-white/85 font-medium flex items-center gap-1.5">
              <span>{cur.emoji}</span>
              <span>{getGreeting()}, chúc bạn một mùa {cur.label.toLowerCase()} thật năng suất!</span>
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-white/20" }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white/15 transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
