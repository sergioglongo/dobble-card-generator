/**
 * Layout de símbolos dentro de una carta circular.
 *
 * Sistema de coordenadas normalizado: el círculo de la carta tiene radio 1
 * y está centrado en (0, 0). Cada símbolo se ubica con (cx, cy) y un
 * `size` que representa el lado del cuadrado contenedor en las mismas
 * unidades (1 = radio de la carta).
 *
 * El layout es determinista a partir de una seed para que el preview en
 * pantalla y el PDF coincidan.
 */

export interface PlacedSymbol {
  /** Centro x del símbolo, en unidades de radio (-1..1). */
  cx: number;
  /** Centro y del símbolo, en unidades de radio (-1..1). */
  cy: number;
  /** Lado del cuadrado contenedor del símbolo (mismas unidades). */
  size: number;
  /** Rotación en radianes. */
  rotation: number;
}

/**
 * Genera un PRNG determinista (mulberry32) a partir de una seed entera.
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Configuración de "anillos" según la cantidad de símbolos por carta.
 * Para cada anillo definimos cuántos símbolos contiene, a qué radio están
 * y de qué tamaño. La suma de `count` por todos los anillos debe ser k.
 */
interface RingConfig {
  count: number;
  radius: number; // distancia al centro de la carta (0..1)
  size: number;   // lado del símbolo
}

function ringsFor(k: number): RingConfig[] {
  switch (k) {
    case 3:
      return [{ count: 3, radius: 0.56, size: 0.62 }];
    case 4:
      return [{ count: 4, radius: 0.60, size: 0.54 }];
    case 6:
      return [
        { count: 1, radius: 0, size: 0.54 },
        { count: 5, radius: 0.68, size: 0.44 },
      ];
    case 8:
      return [
        { count: 1, radius: 0, size: 0.48 },
        { count: 7, radius: 0.72, size: 0.36 },
      ];
    default: {
      const outer = Math.max(2, k - 1);
      return [
        { count: 1, radius: 0, size: 0.50 },
        { count: outer, radius: 0.70, size: Math.min(0.44, 2.2 / outer) },
      ];
    }
  }
}

/**
 * Genera el layout de k símbolos dentro de una carta circular.
 *
 * @param k cantidad de símbolos
 * @param seed entero — el mismo seed produce siempre el mismo layout
 * @param opts opciones de variación
 */
export function layoutSymbols(
  k: number,
  seed: number,
  opts: { jitter?: number; randomizeAngle?: boolean; randomizeRotation?: boolean } = {},
): PlacedSymbol[] {
  const { jitter = 0.04, randomizeAngle = true, randomizeRotation = true } = opts;
  const rng = makeRng(seed);
  const rings = ringsFor(k);

  // Estratificación de tamaños: divide el rango [0.78, 1.32] en k franjas iguales
  // y muestrea un multiplicador por franja. Garantiza que en cada carta siempre
  // haya símbolos chicos, medianos y grandes, sin importar el seed.
  const sizeMin = 0.78, sizeMax = 1.32;
  const sizeSlot = (sizeMax - sizeMin) / k;
  const sizeMults = Array.from({ length: k }, (_, idx) =>
    sizeMin + sizeSlot * idx + rng() * sizeSlot,
  );
  // Mezclar la asignación entre posiciones (Fisher-Yates)
  for (let s = sizeMults.length - 1; s > 0; s--) {
    const t = Math.floor(rng() * (s + 1));
    [sizeMults[s], sizeMults[t]] = [sizeMults[t], sizeMults[s]];
  }

  const out: PlacedSymbol[] = [];
  let symIdx = 0;

  for (const ring of rings) {
    const baseAngle = randomizeAngle ? rng() * Math.PI * 2 : 0;
    const step = (Math.PI * 2) / ring.count;

    for (let i = 0; i < ring.count; i++) {
      const a = baseAngle + i * step;
      const r = ring.radius;
      const dr = ring.radius === 0 ? 0 : (rng() - 0.5) * jitter;
      const da = (rng() - 0.5) * jitter * 0.6;
      const rr = Math.max(0, r + dr);
      const cx = rr * Math.cos(a + da);
      const cy = rr * Math.sin(a + da);
      const size = ring.size * sizeMults[symIdx++];
      const rotation = randomizeRotation ? rng() * Math.PI * 2 : 0;
      out.push({ cx, cy, size, rotation });
    }
  }

  return out;
}
