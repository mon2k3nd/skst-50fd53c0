import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Trophy, BarChart3, Users, ArrowRight, FileDown } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Sức Khoẻ Siêu Thị — Theo dõi doanh thu & thi đua" },
      {
        name: "description",
        content:
          "Công cụ phân tích nhanh: dán dữ liệu BI để xem báo cáo doanh thu, thi đua, luỹ kế và quản lý nhân viên.",
      },
    ],
  }),
});

const features = [
  {
    to: "/doanh-thu" as const,
    title: "Doanh Thu",
    desc: "Phân tích doanh thu realtime theo siêu thị, ngành hàng.",
    icon: Store,
    gradient: "var(--gradient-info)",
  },
  {
    to: "/thi-dua" as const,
    title: "Thi Đua",
    desc: "Theo dõi % hoàn thành target, dự kiến về đích.",
    icon: Trophy,
    gradient: "var(--gradient-warning)",
  },
  {
    to: "/luy-ke" as const,
    title: "Luỹ Kế",
    desc: "Báo cáo doanh thu luỹ kế, lãi gộp, tỷ trọng trả chậm.",
    icon: BarChart3,
    gradient: "var(--gradient-success)",
  },
  {
    to: "/nhan-vien" as const,
    title: "Nhân Viên",
    desc: "Quản lý, theo dõi sức khoẻ và thi đua nhân viên.",
    icon: Users,
    gradient: "var(--gradient-hero)",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-brand">
            ★ Công cụ phân tích nhanh
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            THEO DÕI <span className="text-info">SỨC KHOẺ</span> SIÊU THỊ
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Dán dữ liệu từ báo cáo BI vào ô tương ứng — hệ thống tự phân tích, không cần kết nối
            cơ sở dữ liệu.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.to} to={f.to} className="group">
                <Card className="h-full overflow-hidden border-2 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
                  <div
                    className="flex h-24 items-center justify-center"
                    style={{ background: f.gradient }}
                  >
                    <Icon className="h-10 w-10 text-white drop-shadow" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-info group-hover:gap-2 transition-all">
                      Mở công cụ <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border-2 border-dashed border-info/30 bg-info/5 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-info/15 p-2 text-info">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Xuất báo cáo PDF gửi quản lý</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Mỗi mục (Doanh Thu, Thi Đua, Luỹ Kế, Nhân Viên) đều có nút <strong>Xuất PDF</strong> ở góc phải sau khi bạn dán dữ liệu. Mở từng trang → dán dữ liệu → bấm <strong>Xuất PDF</strong> để tải file gửi cấp trên.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
