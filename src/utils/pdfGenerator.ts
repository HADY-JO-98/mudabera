import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Wait for all web fonts (Cairo, Poppins, etc.) to be ready before snapshotting.
 * This prevents Arabic letters from being rendered with a fallback font that
 * lacks proper ligature shaping (which is what causes "disconnected" letters).
 */
const ensureFontsReady = async (): Promise<void> => {
  try {
    const doc = document as unknown as { fonts?: { ready: Promise<void>; load(font: string): Promise<unknown[]> } };
    if (typeof document !== 'undefined' && doc.fonts?.ready) {
      await doc.fonts.ready;
      // Explicitly load the weights we use to be safe
      if (doc.fonts.load) {
        await Promise.all([
          doc.fonts.load('400 16px Cairo'),
          doc.fonts.load('700 16px Cairo'),
          doc.fonts.load('900 16px Cairo'),
        ]).catch(() => {});
      }
    }
  } catch {
    // best-effort
  }
};

export const generateFullReport = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn('Report element not found:', elementId);
    return;
  }

  // Make sure Arabic-capable fonts are loaded first
  await ensureFontsReady();

  // Detect direction from the element so RTL languages render correctly
  const isRTL = element.getAttribute('dir') === 'rtl' || element.dir === 'rtl';

  // Clone the element to render it properly without affecting the DOM
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'absolute';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = '900px';
  clone.style.opacity = '1';
  clone.style.pointerEvents = 'none';
  clone.style.zIndex = '-9999';
  clone.style.background = '#ffffff';
  clone.style.color = '#1e293b';
  // Force Cairo so Arabic ligatures stay connected (no fallback to system fonts)
  clone.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', sans-serif";
  if (isRTL) {
    clone.setAttribute('dir', 'rtl');
    clone.setAttribute('lang', 'ar');
  }
  document.body.appendChild(clone);

  // One more frame so the browser lays out the clone with the correct font
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 900,
      height: clone.scrollHeight,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const width = imgWidth * ratio;
    const height = imgHeight * ratio;
    const x = (pdfWidth - width) / 2;

    // Handle multi-page if content is taller than one page
    if (height > pdfHeight) {
      const pageCanvasHeight = (pdfHeight / ratio);
      let yOffset = 0;
      let page = 0;

      while (yOffset < imgHeight) {
        if (page > 0) pdf.addPage();

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        pageCanvas.height = Math.min(pageCanvasHeight, imgHeight - yOffset);
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, -yOffset);
          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageHeight = pageCanvas.height * ratio;
          pdf.addImage(pageImgData, 'PNG', x, 0, width, pageHeight);
        }

        yOffset += pageCanvasHeight;
        page++;
      }
    } else {
      pdf.addImage(imgData, 'PNG', x, 0, width, height);
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(clone);
  }
};
