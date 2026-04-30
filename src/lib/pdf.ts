import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// html2canvas (v1) cannot parse modern color functions like oklch()/oklab()/color().
// Our design tokens use oklch, so we pre-resolve every element's color-related
// styles to plain rgb() inside the cloned document right before rendering.
const COLOR_PROPS = [
  "color",
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "fill",
  "stroke",
  "caret-color",
  "column-rule-color",
] as const;

function sanitizeColors(root: HTMLElement) {
  const win = root.ownerDocument?.defaultView;
  if (!win) return;
  const all = root.querySelectorAll<HTMLElement>("*");
  const apply = (el: HTMLElement) => {
    const cs = win.getComputedStyle(el);
    for (const prop of COLOR_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v && v.trim()) el.style.setProperty(prop, v);
    }
    // Backgrounds (gradients) — keep computed value if it contains oklch
    const bg = cs.getPropertyValue("background-image");
    if (bg && bg !== "none") {
      // Replace any oklch(...) inside gradients with the computed fallback rgb
      // Browsers already resolved this in getComputedStyle for gradients in
      // most cases; assigning back is safe.
      el.style.setProperty("background-image", bg);
    }
  };
  apply(root);
  all.forEach(apply);
}

/**
 * Export one or more DOM elements to a single PDF (A4 portrait).
 * Each element becomes one page (if it's taller than a page it will be sliced across pages).
 */
export async function exportElementsToPdf(
  elements: (HTMLElement | null)[],
  filename: string,
) {
  const valid = elements.filter((el): el is HTMLElement => !!el);
  if (valid.length === 0) return;

  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentW = pageW - margin * 2;

  for (let i = 0; i < valid.length; i++) {
    const el = valid[i];
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (doc, clonedEl) => {
        sanitizeColors(clonedEl as HTMLElement);
        // Also walk the entire cloned document body so ancestor backgrounds
        // (e.g. body/main) don't break with oklch.
        if (doc.body) sanitizeColors(doc.body);
      },
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const ratio = canvas.height / canvas.width;
    const imgW = contentW;
    const imgH = imgW * ratio;

    if (i > 0) pdf.addPage();

    if (imgH <= pageH - margin * 2) {
      pdf.addImage(imgData, "JPEG", margin, margin, imgW, imgH);
    } else {
      // slice
      const pageContentH = pageH - margin * 2;
      const sliceCanvas = document.createElement("canvas");
      const ctx = sliceCanvas.getContext("2d")!;
      sliceCanvas.width = canvas.width;
      // each slice = pageContentH (in mm) of the rendered image
      const sliceHpx = (pageContentH / imgH) * canvas.height;
      sliceCanvas.height = sliceHpx;

      let y = 0;
      let first = true;
      while (y < canvas.height) {
        const h = Math.min(sliceHpx, canvas.height - y);
        sliceCanvas.height = h;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, h);
        ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const sliceRatio = h / canvas.width;
        const sliceImgH = imgW * sliceRatio;
        if (!first) pdf.addPage();
        first = false;
        pdf.addImage(sliceData, "JPEG", margin, margin, imgW, sliceImgH);
        y += h;
      }
    }
  }

  pdf.save(filename);
}