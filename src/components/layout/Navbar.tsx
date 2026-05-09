import { Link } from "@tanstack/react-router";
import { Activity, Home, Store, Users, BarChart3, Trophy } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/doanh-thu", label: "Doanh Thu", icon: Store },
  { to: "/thi-dua", label: "Thi Đua", icon: Trophy },
  { to: "/luy-ke", label: "Luỹ Kế", icon: BarChart3 },
  { to: "/nhan-vien", label: "Nhân Viên", icon: Users },
] as const;

export function Navbar() {
  return (
    <header
      className="sticky top-0 z-40 w-full text-white shadow-[var(--shadow-elevated)]"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur transition-transform group-hover:scale-110">
            <Activity className="h-5 w-5 text-yellow-300" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-2xl font-extrabold tracking-tight drop-shadow-sm">
              <span className="text-yellow-300">Metric</span>
              <span className="text-white">Hub</span>
            </span>
            <span className="hidden text-[11px] italic text-white/85 sm:inline">
              Real-time Data, Real-time Success
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-all hover:bg-white/15"
                activeProps={{ className: "bg-white/20 text-yellow-300 ring-1 ring-yellow-300/40" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-1 text-center text-[11px] italic text-white/80 sm:hidden">
        MetricHub – Real-time Data, Real-time Success
      </div>
    </header>
  );
}
