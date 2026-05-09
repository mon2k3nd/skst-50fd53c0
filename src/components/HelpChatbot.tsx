import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const SUGGESTIONS = [
  "Cách dùng trang Nhân Viên?",
  "Chia target nhân viên thế nào?",
  "Công thức % dự kiến cuối tháng?",
  "Đổi mùa giao diện ở đâu?",
];

export function HelpChatbot() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Xin chào 👋 Mình là **MetricHub Trợ Lý**. Hỏi mình bất cứ điều gì về cách dùng phần mềm — từ Doanh Thu, Thi Đua, Luỹ Kế đến Nhân Viên.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setBusy(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/help-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON}`,
          apikey: ANON,
        },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: "Lỗi" }));
        setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${j.error ?? "Không gọi được AI."}` }]);
        return;
      }

      // Stream parse SSE
      setMsgs((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const ln of lines) {
          if (!ln.startsWith("data:")) continue;
          const data = ln.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta: string = j?.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              setMsgs((m) => {
                const c = [...m];
                c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + delta };
                return c;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Lỗi mạng."}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      {/* Floating button — right side, above credit badge, lifts with footer */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ bottom: "calc(var(--footer-lift, 2.25rem) + 3.5rem)" }}
        className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-card transition-all duration-500 hover:scale-110"
        aria-label="Trợ lý MetricHub"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel — anchored to right */}
      <div
        className={`fixed right-4 z-50 w-[min(380px,calc(100vw-2rem))] origin-bottom-right rounded-2xl border bg-card shadow-card transition-all duration-500 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
        style={{ bottom: "calc(var(--footer-lift, 2.25rem) + 8rem)", maxHeight: "70vh" }}
      >
        <div className="flex items-center gap-2 border-b bg-gradient-header px-4 py-3 rounded-t-2xl text-white">
          <Sparkles className="h-4 w-4" />
          <div className="flex-1">
            <div className="text-sm font-bold">MetricHub Trợ Lý</div>
            <div className="text-[10px] opacity-80">Hỏi gì cũng đáp về phần mềm</div>
          </div>
        </div>

        <div ref={scrollRef} className="overflow-y-auto px-3 py-3 space-y-3" style={{ maxHeight: "44vh" }}>
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand text-brand-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 dark:prose-invert">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </div>
            </div>
          ))}
          {busy && msgs[msgs.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
              </div>
            </div>
          )}
        </div>

        {msgs.length <= 1 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-brand hover:text-brand"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t p-2 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Hỏi về MetricHub…"
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            disabled={busy}
          />
          <Button
            size="icon"
            onClick={() => send()}
            disabled={busy || !input.trim()}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );
}
