/**
 * Motor combinatorio para mazos tipo Dobble / Spot It!
 *
 * Basado en plano proyectivo finito de orden n. Cuando n es primo, existe
 * una construcción cerrada y simple que garantiza:
 *   - n² + n + 1 cartas
 *   - n² + n + 1 símbolos distintos
 *   - n + 1 símbolos por carta
 *   - cada par de cartas comparte exactamente UN símbolo
 *
 * Los órdenes soportados por este MVP son n ∈ {2, 3, 5, 7} (primos),
 * lo que da barajas de 7, 13, 31 y 57 cartas respectivamente.
 *
 * Referencia: https://www.hicreategames.com/the-math-behind-spot-it/
 */

export type Card = number[]; // lista de IDs de símbolos
export type Deck = Card[];

export const SUPPORTED_ORDERS = [2, 3, 5, 7] as const;
export type SupportedOrder = (typeof SUPPORTED_ORDERS)[number];

export interface DeckStats {
  order: number;
  cards: number;
  symbols: number;
  symbolsPerCard: number;
}

/**
 * Devuelve las estadísticas teóricas de un mazo de orden n.
 */
export function deckStats(n: number): DeckStats {
  return {
    order: n,
    cards: n * n + n + 1,
    symbols: n * n + n + 1,
    symbolsPerCard: n + 1,
  };
}

/**
 * Verifica si un número es primo. Cuando n no es primo, la construcción
 * cerrada falla (n=6 por ejemplo no admite plano proyectivo).
 */
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

/**
 * Genera un mazo Dobble de orden n (n primo).
 *
 * Construcción canónica:
 *   1) Una "carta especial" con los símbolos {0, 1, ..., n}.
 *   2) n cartas que comparten el símbolo 0; cada una usa una fila distinta
 *      de la matriz de símbolos restantes.
 *   3) n*n cartas restantes parametrizadas por (i, j) que utilizan
 *      aritmética modular (mod n) para colocar n+1 símbolos sin colisiones.
 *
 * Salida: Card[] con n²+n+1 elementos, cada uno con n+1 enteros.
 */
export function generateDeck(n: number): Deck {
  if (!Number.isInteger(n) || n < 2) {
    throw new Error(`El orden debe ser un entero >= 2 (recibido: ${n})`);
  }
  if (!isPrime(n)) {
    throw new Error(
      `El orden ${n} no es primo. Soportados: ${SUPPORTED_ORDERS.join(', ')}.`,
    );
  }

  const cards: Deck = [];

  // 1) Carta especial: símbolos 0..n
  const firstCard: Card = [];
  for (let i = 0; i <= n; i++) firstCard.push(i);
  cards.push(firstCard);

  // 2) n cartas que pasan por el "punto" 0
  for (let j = 0; j < n; j++) {
    const card: Card = [0];
    for (let i = 0; i < n; i++) {
      card.push(n + 1 + n * j + i);
    }
    cards.push(card);
  }

  // 3) n*n cartas restantes
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const card: Card = [i + 1];
      for (let k = 0; k < n; k++) {
        card.push(n + 1 + n * k + ((i * k + j) % n));
      }
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Permuta los símbolos del mazo según un mapeo. Útil para mezclar la
 * asignación entre IDs internos e imágenes elegidas por el usuario.
 */
export function remapDeck(deck: Deck, mapping: number[]): Deck {
  return deck.map((card) => card.map((id) => mapping[id]));
}

/**
 * Mezcla in-place una copia (Fisher–Yates) y la devuelve. Se puede pasar
 * una función rng para tests deterministas.
 */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Valida la propiedad fundamental: cada par de cartas comparte exactamente
 * un símbolo. Devuelve true si el mazo es válido.
 *
 * Lanza un error con detalle del primer par que falla cuando strict=true.
 */
export function validateDeck(deck: Deck, opts: { strict?: boolean } = {}): boolean {
  const { strict = false } = opts;
  for (let a = 0; a < deck.length; a++) {
    const setA = new Set(deck[a]);
    for (let b = a + 1; b < deck.length; b++) {
      let shared = 0;
      for (const sym of deck[b]) {
        if (setA.has(sym)) shared++;
      }
      if (shared !== 1) {
        if (strict) {
          throw new Error(
            `Cartas ${a} y ${b} comparten ${shared} símbolos (debería ser 1).`,
          );
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Atajo: genera y valida en un solo paso. Si no pasa la validación,
 * lanza error (debería ser imposible para n primo).
 */
export function generateAndValidate(n: number): Deck {
  const deck = generateDeck(n);
  validateDeck(deck, { strict: true });
  return deck;
}
