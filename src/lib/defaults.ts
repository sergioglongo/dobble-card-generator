/**
 * Lista de iconos predeterminados (basados en Noto Emoji) 
 * que el usuario vio y aprobó.
 */

export const DEFAULT_ICON_NAMES = [
  'noto:whale', 'noto:monkey', 'noto:cow', 'noto:rabbit', 'noto:coin',
  'noto:pencil', 'noto:magnifying-glass-tilted-left', 'noto:sunglasses', 'noto:cat', 'noto:bus',
  'noto:airplane', 'noto:ship', 'noto:cloud-with-rain', 'noto:ringed-planet', 'noto:soccer-ball',
  'noto:birthday-cake', 'noto:mans-shoe', 'noto:television', 'noto:helicopter', 'noto:horse',
  'noto:pizza', 'noto:ear-of-corn', 'noto:penguin', 'noto:lion', 'noto:umbrella',
  'noto:pig', 'noto:desktop-computer', 'noto:computer-mouse', 'noto:evergreen-tree', 'noto:palm-tree',
  'noto:baby'
];

/**
 * Función auxiliar para convertir un SVG de Iconify a Data URL
 * con las correcciones de tamaño necesarias.
 */
export function iconToDataUrl(svgText: string): string {
  // Limpieza para asegurar que llene el contenedor (100%)
  const cleaned = svgText.replace(/<svg([^>]*)>/, (_, body) => {
    const cleanBody = body.replace(/\b(width|height)=["'][^"']*["']/g, '').trim();
    return `<svg ${cleanBody} width="100%" height="100%">`;
  });
  const base64 = btoa(unescape(encodeURIComponent(cleaned)));
  return `data:image/svg+xml;base64,${base64}`;
}
