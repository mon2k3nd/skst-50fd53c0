import { Link } from "@tanstack/react-router";
import { Heart, Home, Store, Users, BarChart3, Trophy } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/doanh-thu", label: "Doanh Thu", icon: Store },
  { to: "/thi-dua", label: "Thi Đua", icon: Trophy },
  { to: "/luy-ke", label: "Luỹ Kế", icon: BarChart3 },
  { to: "/nhan-vien", label: "Nhân Viên", icon: Users },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-brand text-brand-foreground shadow-[var(--shadow-card)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-warning drop-shadow">
            Sức Khoẻ
          </span>
          <span className="text-xl font-extrabold tracking-tight text-brand-foreground">
            Siêu Thị
          </span>
          <Heart className="h-5 w-5 fill-destructive text-destructive" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-brand-foreground/10"
                activeProps={{ className: "text-warning" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}