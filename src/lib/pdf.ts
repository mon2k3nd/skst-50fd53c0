import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// html2canvas (v1) cannot parse modern color functions like oklch()/oklab()/color().
// Our design tokens use oklch, so we pre-resolve every element's color-related
// styles to plain rgb() inside the cloned document right before rendering.

// Minimal oklch -> sRGB converter (returns "rgb(r,g,b)" or "rgba(r,g,b,a)").
function oklchToRgb(L: number, C: number, h: number, alpha = 1): string {
  const hr = (h * Math.PI) / 180;
  const a = Math.cos(hr) * C;
  const b = Math.sin(hr) * C;
  // OKLab -> linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const toSrgb = (x: number) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  };
  const R = toSrgb(r),
    G = toSrgb(g),
    B = toSrgb(bl);
  return alpha < 1 ? `rgba(${R},${G},${B},${alpha})` : `rgb(${R},${G},${B})`;
}

// Replace any oklch(...) occurrences in a CSS value string with rgb().
function replaceOklch(value: string): string {
  if (!value || !value.includes("oklch")) return value;
  return value.replace(
    /oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi,
    (_m, lRaw: string, cRaw: string, hRaw: string, aRaw?: string) => {
      let L = parseFloat(lRaw);
      if (lRaw.endsWith("%")) L = L / 100;
      const C = parseFloat(cRaw);
      const h = parseFloat(hRaw);
      let alpha = 1;
      if (aRaw) {
        alpha = parseFloat(aRaw);
        if (aRaw.endsWith("%")) alpha = alpha / 100;
      }
      return oklchToRgb(L, C, h, alpha);
    },
  );
}

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
      if (v && v.trim()) el.style.setProperty(prop, replaceOklch(v));
    }
    const bg = cs.getPropertyValue("background-image");
    if (bg && bg !== "none") {
      el.style.setProperty("background-image", replaceOklch(bg));
    }
    const boxShadow = cs.getPropertyValue("box-shadow");
    if (boxShadow && boxShadow !== "none") {
      el.style.setProperty("box-shadow", replaceOklch(boxShadow));
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
      onclone: (doc: Document, clonedEl: Element) => {
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