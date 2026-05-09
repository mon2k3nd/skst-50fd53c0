import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Store, Trophy, BarChart3, Users, ArrowRight } from "lucide-react";
import { useSeason, SEASONS } from "@/lib/season";

export const Route = createFileRoute("/")({ component: Index });

const tools = [
  { to: "/doanh-thu", title: "Doanh Thu", desc: "Phân tích doanh thu realtime theo siêu thị, ngành hàng.", icon: Store, tone: "var(--season-1)" },
  { to: "/thi-dua", title: "Thi Đua", desc: "Theo dõi % hoàn thành target, dự kiến về đích.", icon: Trophy, tone: "var(--season-2)" },
  { to: "/luy-ke", title: "Luỹ Kế", desc: "Báo cáo doanh thu luỹ kế, lãi gộp, tỷ trọng trả chậm.", icon: BarChart3, tone: "var(--season-3)" },
  { to: "/nhan-vien", title: "Nhân Viên", desc: "Quản lý, theo dõi sức khoẻ và thi đua nhân viên.", icon: Users, tone: "var(--season-4)" },
] as const;

function Index() {
  const { season } = useSeason();
  const cur = SEASONS.find((s) => s.id === season)!;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pb-32">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-20 pb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold text-secondary-foreground">
            {cur.emoji} Mùa {cur.label} · Công cụ phân tích nhanh
          </span>
          <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight">
            <span className="text-primary">Metric</span>
            <span>Hub</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time Data, Real-time Success — dán dữ liệu BI, hệ thống tự phân tích theo mùa.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ to, title, desc, icon: Icon, tone }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl bg-card border shadow-card overflow-hidden hover:-translate-y-1 transition-all"
            >
              <div
                className="h-28 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${tone}, var(--primary))` }}
              >
                <Icon className="h-10 w-10 text-white drop-shadow" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Mở công cụ <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
