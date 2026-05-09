import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { CreditBadge } from "@/components/layout/CreditBadge";
import { Footer } from "@/components/layout/Footer";
import { SeasonProvider } from "@/contexts/SeasonContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MetricHub – Real-time Data, Real-time Success" },
      { name: "description", content: "MetricHub: real-time data analytics for retail sales, employee performance, and cumulative growth." },
      { name: "author", content: "MetricHub" },
      { property: "og:title", content: "MetricHub – Real-time Data, Real-time Success" },
      { property: "og:description", content: "MetricHub: real-time data analytics for retail sales, employee performance, and cumulative growth." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "MetricHub – Real-time Data, Real-time Success" },
      { name: "twitter:description", content: "MetricHub: real-time data analytics for retail sales, employee performance, and cumulative growth." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/649ab18a-0675-4f69-8208-5054a3c7004b/id-preview-9f25f10f--a2c0c652-a243-4bc7-8522-daf1a0d2488a.lovable.app-1778264083114.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/649ab18a-0675-4f69-8208-5054a3c7004b/id-preview-9f25f10f--a2c0c652-a243-4bc7-8522-daf1a0d2488a.lovable.app-1778264083114.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="season-autumn">
      <head>
        <HeadContent />
      </head>
      <body className="pb-16">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <SeasonProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
      <CreditBadge />
      <Footer />
    </SeasonProvider>
  );
}
