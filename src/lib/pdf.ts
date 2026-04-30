import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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