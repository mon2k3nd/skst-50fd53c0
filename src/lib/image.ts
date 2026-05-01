import html2canvas from "html2canvas";

/**
 * Rasterize an element to PNG and trigger a download. The element should be
 * styled with rgb()/hex only (no oklch) since html2canvas v1 cannot parse
 * modern color functions.
 */
export async function downloadElementAsPng(el: HTMLElement | null, filename: string) {
  if (!el) throw new Error("Phần tử báo cáo chưa sẵn sàng.");
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}