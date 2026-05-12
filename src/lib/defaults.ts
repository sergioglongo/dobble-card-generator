/**
 * Set de símbolos por defecto (SVG inline). Suficientes para probar
 * mazos de n=2 (7 símbolos) y n=3 (13 símbolos). Para n=5 o n=7 el
 * usuario debe subir el resto.
 *
 * Cada SVG usa viewBox 0 0 100 100 y un único color sólido para que
 * se vea bien al recortar. Se exportan como data URLs listas para usar
 * en <img src> y pdf-lib.
 */

import type { StoredImage } from './storage';

interface Raw {
  name: string;
  color: string;
  /** body interno del <svg>, viewBox 0 0 100 100 */
  body: string;
}

const RAW: Raw[] = [
  {
    name: 'Corazón',
    color: '#e63946',
    body: '<path d="M50 86 C 20 65, 5 45, 18 27 C 30 12, 45 18, 50 32 C 55 18, 70 12, 82 27 C 95 45, 80 65, 50 86 Z"/>',
  },
  {
    name: 'Estrella',
    color: '#f4a017',
    body: '<path d="M50 8 L61 38 L93 38 L67 57 L77 88 L50 70 L23 88 L33 57 L7 38 L39 38 Z"/>',
  },
  {
    name: 'Rayo',
    color: '#fbbf24',
    body: '<path d="M55 6 L25 56 L46 56 L40 94 L75 40 L52 40 Z"/>',
  },
  {
    name: 'Diamante',
    color: '#06b6d4',
    body: '<path d="M50 8 L92 50 L50 92 L8 50 Z"/>',
  },
  {
    name: 'Triángulo',
    color: '#84cc16',
    body: '<path d="M50 10 L92 84 L8 84 Z"/>',
  },
  {
    name: 'Cuadrado',
    color: '#7c3aed',
    body: '<rect x="14" y="14" width="72" height="72" rx="6"/>',
  },
  {
    name: 'Círculo',
    color: '#ef4444',
    body: '<circle cx="50" cy="50" r="38"/>',
  },
  {
    name: 'Hexágono',
    color: '#0ea5e9',
    body: '<path d="M50 8 L88 30 L88 70 L50 92 L12 70 L12 30 Z"/>',
  },
  {
    name: 'Luna',
    color: '#6366f1',
    body: '<path d="M65 12 A 40 40 0 1 0 65 88 A 30 30 0 1 1 65 12 Z"/>',
  },
  {
    name: 'Sol',
    color: '#f59e0b',
    body: '<circle cx="50" cy="50" r="20"/><g stroke="#f59e0b" stroke-width="6" stroke-linecap="round"><line x1="50" y1="8" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="92"/><line x1="8" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="92" y2="50"/><line x1="18" y1="18" x2="28" y2="28"/><line x1="72" y1="72" x2="82" y2="82"/><line x1="82" y1="18" x2="72" y2="28"/><line x1="28" y1="72" x2="18" y2="82"/></g>',
  },
  {
    name: 'Hoja',
    color: '#16a34a',
    body: '<path d="M20 80 C 30 30, 70 20, 88 12 C 80 50, 60 86, 20 80 Z"/><line x1="20" y1="80" x2="60" y2="40" stroke="#0a4d24" stroke-width="3"/>',
  },
  {
    name: 'Gota',
    color: '#0284c7',
    body: '<path d="M50 8 C 30 38, 22 56, 22 68 A 28 28 0 0 0 78 68 C 78 56, 70 38, 50 8 Z"/>',
  },
  {
    name: 'Flecha',
    color: '#db2777',
    body: '<path d="M14 50 L62 50 L62 30 L92 50 L62 70 L62 50 Z"/>',
  },
  {
    name: 'Cruz',
    color: '#0f172a',
    body: '<path d="M40 10 H60 V40 H90 V60 H60 V90 H40 V60 H10 V40 H40 Z"/>',
  },
  {
    name: 'Nube',
    color: '#94a3b8',
    body: '<path d="M28 70 A 16 16 0 0 1 30 38 A 18 18 0 0 1 64 32 A 14 14 0 0 1 80 56 A 12 12 0 0 1 78 80 H 30 A 12 12 0 0 1 28 70 Z"/>',
  },
];

function wrap(body: string, color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="${color}">${body}</svg>`;
}

function toDataUrl(svg: string): string {
  // encodeURIComponent es suficiente; evita problemas con # y comillas
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * Devuelve las imágenes default como StoredImage[] para inyectarlas en
 * el state inicial si el usuario no tiene ninguna cargada.
 */
export function defaultImages(): StoredImage[] {
  const now = Date.now();
  return RAW.map((r, i) => {
    const svg = wrap(r.body, r.color);
    return {
      id: `default-${i}`,
      name: r.name,
      dataUrl: toDataUrl(svg),
      mime: 'image/svg+xml',
      width: 100,
      height: 100,
      addedAt: now + i,
    };
  });
}

export const DEFAULT_COUNT = RAW.length;
