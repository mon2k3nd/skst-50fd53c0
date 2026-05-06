import { toPng } from "html-to-image";

/**
 * Rasterize an element to PNG and trigger a download.
 * Uses html-to-image which supports modern CSS color functions.
 */
export async function downloadElementAsPng(el: HTMLElement | null, filename: string) {
  if (!el) throw new Error("Phần tử báo cáo chưa sẵn sàng.");
  const dataUrl = await toPng(el, {
    backgroundColor: "#ffffff",
    pixelRatio: 2,
    cacheBust: true,
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}