import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Store, Trophy, BarChart3, Users, ArrowRight, Zap, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { useSeason, SEASONS } from "@/lib/season";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({ component: Index });

const tools = [
  { to: "/doanh-thu", title: "Doanh Thu", desc: "Realtime theo siêu thị, ngành hàng.", icon: Store, tone: "var(--season-1)", tag: "Realtime" },
  { to: "/thi-dua", title: "Thi Đua", desc: "% hoàn thành target & dự kiến về đích.", icon: Trophy, tone: "var(--season-2)", tag: "Target" },
  { to: "/luy-ke", title: "Luỹ Kế", desc: "Doanh thu luỹ kế, lãi gộp, trả chậm.", icon: BarChart3, tone: "var(--season-3)", tag: "Báo cáo" },
  { to: "/nhan-vien", title: "Nhân Viên", desc: "Sức khoẻ & thi đua nhân viên theo ngày.", icon: Users, tone: "var(--season-4)", tag: "AI" },
] as const;

const features = [
  { icon: Zap, title: "Phân tích tức thì", desc: "Dán dữ liệu BI, kết quả hiển thị trong vài giây." },
  { icon: Sparkles, title: "AI hỗ trợ", desc: "AI tự nhận diện ngành hàng & gợi ý phân bổ target." },
  { icon: Clock, title: "Tiết kiệm thời gian", desc: "Giảm 80% thời gian làm báo cáo cuối ca." },
  { icon: ShieldCheck, title: "Dữ liệu của bạn", desc: "Không lưu trữ, không chia sẻ — xử lý cục bộ." },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 13) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function Index() {
  const { season } = useSeason();
  const cur = SEASONS.find((s) => s.id === season)!;
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleString("vi-VN", { weekday: "long", hour: "2-digit", minute: "2-digit" });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pb-32 relative">
        {/* HERO */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-12">
          <div className="relative overflow-hidden rounded-3xl border bg-card/60 backdrop-blur shadow-card">
            <div
              className="absolute inset-0 opacity-90"
              style={{ background: "var(--gradient-hero)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/20 to-transparent" />
            <div className="relative px-6 sm:px-10 py-12 sm:py-16 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 text-xs font-semibold text-foreground shadow-card backdrop-blur">
                <span className="text-base">{cur.emoji}</span>
                {getGreeting()} · Mùa {cur.label}
                {now && <span className="hidden sm:inline opacity-60">· {now}</span>}
              </span>
              <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                Chào mừng đến với{" "}
                <span className="text-primary">Metric</span>
                <span>Hub</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto">
                Real-time Data, Real-time Success — dán dữ liệu BI, hệ thống tự phân tích theo mùa{" "}
                <span className="font-semibold">{cur.label.toLowerCase()}</span> {cur.tagline.toLowerCase()}.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  to="/nhan-vien"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-card transition hover:scale-105"
                >
                  <Sparkles className="h-4 w-4" /> Bắt đầu phân tích
                </Link>
                <Link
                  to="/doanh-thu"
                  className="inline-flex items-center gap-2 rounded-full border bg-card/90 px-6 py-3 text-sm font-bold text-foreground shadow-card transition hover:scale-105"
                >
                  Xem doanh thu <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* TOOLS */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ to, title, desc, icon: Icon, tone, tag }) => (
            <Link
              key={to}
              to={to}
              className="group relative rounded-2xl bg-card border shadow-card overflow-hidden hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300"
            >
              <div
                className="relative h-32 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${tone}, var(--primary))` }}
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-xl" />
                <Icon className="relative h-12 w-12 text-white drop-shadow group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute top-2 right-2 rounded-full bg-white/25 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white">
                  {tag}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Mở công cụ
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Vì sao chọn MetricHub?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Nhanh, gọn, đẹp — và đổi chủ đề theo bốn mùa.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border bg-card/80 backdrop-blur p-5 shadow-card hover:-translate-y-0.5 transition-all"
              >
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-card"
                  style={{ background: "var(--gradient-header)" }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
