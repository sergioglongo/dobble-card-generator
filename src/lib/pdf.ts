/**
 * Generación de PDF imprimible con pdf-lib.
 *
 * Output: A4 vertical, 6 cartas cuadradas por hoja (grilla 2 columnas × 3
 * filas). Las cartas comparten bordes para que las líneas de corte sean
 * continuas: 3 líneas verticales y 4 horizontales por hoja alcanzan para
 * separar todas las cartas con tijera o guillotina.
 *
 * Las imágenes PNG/JPEG se embeben directamente. Los SVGs se rasterizan
 * en canvas (pdf-lib no soporta SVG nativo) y luego se embeben como PNG.
 */

import { PDFDocument, PDFImage, PDFPage, StandardFonts, degrees, rgb } from 'pdf-lib';
import type { Deck } from './dobble';
import { layoutSymbols } from './layout';
import type { StoredImage } from './storage';

export interface PdfOptions {
  /** Lado de la carta cuadrada en puntos (1pt = 1/72 inch). Default 265 (~93.5mm). */
  cardSidePt?: number;
  /** Seed para el layout. */
  seed?: number;
  /** Mostrar líneas de corte aprovechables (atraviesan toda la cuadrícula). */
  showCutLine?: boolean;
  /** Color RGB del fondo de las cartas (0..1). */
  backgroundColor?: { r: number; g: number; b: number };
  /** Mostrar un pie de página con info del mazo. */
  showFooter?: boolean;
  /** Resolución para rasterizar SVGs (lado en px). */
  svgRasterSize?: number;
  /** Callback de progreso (entre 0 y 1) para mostrar barra en UI. */
  onProgress?: (progress: number) => void;
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

export async function generatePdf(
  images: StoredImage[],
  deck: Deck,
  opts: PdfOptions = {},
): Promise<Uint8Array> {
  const {
    cardSidePt = 265,
    seed = 1,
    showCutLine = true,
    backgroundColor = { r: 1, g: 1, b: 1 },
    showFooter = true,
    svgRasterSize = 512,
    onProgress,
  } = opts;

  const maxId = Math.max(...deck.flat());
  if (maxId >= images.length) {
    throw new Error(
      `Faltan imágenes: el mazo necesita ${maxId + 1} símbolos pero solo hay ${images.length}.`,
    );
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.setTitle('Dobble Card Generator');
  pdf.setCreator('Dobble Card Generator');

  const used = new Set<number>(deck.flat());
  const usedIds = Array.from(used).sort((a, b) => a - b);

  const embedded = new Map<number, PDFImage>();
  let i = 0;
  for (const id of usedIds) {
    const img = await embedImage(pdf, images[id], svgRasterSize);
    embedded.set(id, img);
    i++;
    onProgress?.(0.1 + (0.6 * i) / usedIds.length);
  }

  // Grilla 2 columnas x 3 filas (6 cartas por hoja). Las cartas se tocan
  // entre sí para que las líneas de corte sean continuas y atraviesen
  // toda la fila/columna de una sola pasada.
  const COLS = 2;
  const ROWS = 3;
  const cardsPerPage = COLS * ROWS;
  const side = cardSidePt;
  const gridW = COLS * side;
  const gridH = ROWS * side;
  if (gridW > A4_WIDTH || gridH > A4_HEIGHT - 40) {
    throw new Error(
      `cardSidePt=${side} es demasiado grande para 2x3 en A4. ` +
        `Máximo: ${Math.floor(Math.min(A4_WIDTH / COLS, (A4_HEIGHT - 40) / ROWS))}.`,
    );
  }
  const gridX0 = (A4_WIDTH - gridW) / 2;
  const gridY0 = (A4_HEIGHT - gridH) / 2;
  const pages = Math.ceil(deck.length / cardsPerPage);

  for (let p = 0; p < pages; p++) {
    const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);

    for (let slot = 0; slot < cardsPerPage; slot++) {
      const cardIdx = p * cardsPerPage + slot;
      if (cardIdx >= deck.length) break;
      const col = slot % COLS;
      const row = Math.floor(slot / COLS);
      const x = gridX0 + col * side;
      const y = gridY0 + (ROWS - 1 - row) * side;

      drawCard(page, deck[cardIdx], embedded, {
        x,
        y,
        side,
        seed: seed + cardIdx * 7919,
        backgroundColor,
      });
    }

    if (showCutLine) {
      drawCutGrid(page, { x0: gridX0, y0: gridY0, cols: COLS, rows: ROWS, side });
    }

    if (showFooter) {
      page.drawText(`Dobble Card Generator — hoja ${p + 1} / ${pages}`, {
        x: 30,
        y: 18,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    onProgress?.(0.7 + (0.3 * (p + 1)) / pages);
  }

  onProgress?.(1);
  return pdf.save();
}

function drawCard(
  page: PDFPage,
  card: number[],
  embedded: Map<number, PDFImage>,
  opts: {
    x: number;
    y: number;
    side: number;
    seed: number;
    backgroundColor: { r: number; g: number; b: number };
  },
) {
  const { x, y, side, seed, backgroundColor } = opts;
  const half = side / 2;
  const cx = x + half;
  const cy = y + half;

  page.drawRectangle({
    x,
    y,
    width: side,
    height: side,
    color: rgb(backgroundColor.r, backgroundColor.g, backgroundColor.b),
  });

  const layout = layoutSymbols(card.length, seed);
  const inner = half * 0.92;

  for (let i = 0; i < card.length; i++) {
    const symbolId = card[i];
    const img = embedded.get(symbolId);
    if (!img) continue;

    const pos = layout[i];
    const targetSize = pos.size * inner;
    const ratio = img.width / img.height;
    let w: number;
    let h: number;
    if (ratio >= 1) {
      w = targetSize;
      h = targetSize / ratio;
    } else {
      h = targetSize;
      w = targetSize * ratio;
    }

    const centerX = cx + pos.cx * inner;
    const centerY = cy + pos.cy * inner;

    const theta = pos.rotation;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const x2 = centerX - (w / 2) * cos + (h / 2) * sin;
    const y2 = centerY - (w / 2) * sin - (h / 2) * cos;

    page.drawImage(img, {
      x: x2,
      y: y2,
      width: w,
      height: h,
      rotate: degrees((theta * 180) / Math.PI),
    });
  }
}

/**
 * Dibuja las guías de corte: líneas punteadas esparsas a lo largo de cada
 * fila y columna, más una cruz (+) sólida en cada punto de intersección
 * de la grilla (bordes e interiores). Las cruces indican dónde colocar
 * la tijera o guillotina.
 */
function drawCutGrid(
  page: PDFPage,
  opts: { x0: number; y0: number; cols: number; rows: number; side: number },
) {
  const { x0, y0, cols, rows, side } = opts;
  const gridW = cols * side;
  const gridH = rows * side;

  const dashColor = rgb(0.55, 0.55, 0.55);
  const crossColor = rgb(0.15, 0.15, 0.15);
  const crossArm = 6; // semilongitud de cada brazo de la cruz (pt)

  // Líneas punteadas verticales
  for (let i = 0; i <= cols; i++) {
    const x = x0 + i * side;
    page.drawLine({
      start: { x, y: y0 },
      end: { x, y: y0 + gridH },
      thickness: 0.4,
      color: dashColor,
      dashArray: [3, 11],
    });
  }

  // Líneas punteadas horizontales
  for (let j = 0; j <= rows; j++) {
    const y = y0 + j * side;
    page.drawLine({
      start: { x: x0, y },
      end: { x: x0 + gridW, y },
      thickness: 0.4,
      color: dashColor,
      dashArray: [3, 11],
    });
  }

  // Cruz (+) en cada punto de intersección de la grilla
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      const x = x0 + i * side;
      const y = y0 + j * side;
      page.drawLine({
        start: { x: x - crossArm, y },
        end: { x: x + crossArm, y },
        thickness: 0.7,
        color: crossColor,
      });
      page.drawLine({
        start: { x, y: y - crossArm },
        end: { x, y: y + crossArm },
        thickness: 0.7,
        color: crossColor,
      });
    }
  }
}

async function embedImage(
  pdf: PDFDocument,
  image: StoredImage,
  svgRasterSize: number,
): Promise<PDFImage> {
  if (image.mime === 'image/svg+xml') {
    const pngBytes = await rasterizeSvg(image.dataUrl, svgRasterSize);
    return pdf.embedPng(pngBytes);
  }
  const bytes = dataUrlToBytes(image.dataUrl);
  if (image.mime === 'image/jpeg' || image.mime === 'image/jpg') {
    return pdf.embedJpg(bytes);
  }
  return pdf.embedPng(bytes);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  if (meta.includes(';base64')) {
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  const decoded = decodeURIComponent(body);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes;
}

async function rasterizeSvg(dataUrl: string, size: number): Promise<Uint8Array> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.clearRect(0, 0, size, size);
  const ratio = img.naturalWidth / img.naturalHeight || 1;
  let dw = size;
  let dh = size;
  if (ratio >= 1) dh = size / ratio;
  else dw = size * ratio;
  const dx = (size - dw) / 2;
  const dy = (size - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob falló'))), 'image/png');
  });
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar imagen: ${src.slice(0, 60)}…`));
    img.src = src;
  });
}

export function downloadPdf(bytes: Uint8Array, filename = 'dobble.pdf'): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
