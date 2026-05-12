import { describe, it, expect } from 'vitest';
import {
  generateDeck,
  validateDeck,
  deckStats,
  isPrime,
  SUPPORTED_ORDERS,
  remapDeck,
  shuffle,
} from './dobble';

describe('isPrime', () => {
  it('detecta primos pequeños', () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(3)).toBe(true);
    expect(isPrime(5)).toBe(true);
    expect(isPrime(7)).toBe(true);
    expect(isPrime(11)).toBe(true);
  });
  it('descarta no-primos', () => {
    expect(isPrime(1)).toBe(false);
    expect(isPrime(0)).toBe(false);
    expect(isPrime(4)).toBe(false);
    expect(isPrime(6)).toBe(false);
    expect(isPrime(9)).toBe(false);
  });
});

describe('deckStats', () => {
  it('Dobble clásico tiene 57/57/8', () => {
    expect(deckStats(7)).toEqual({
      order: 7,
      cards: 57,
      symbols: 57,
      symbolsPerCard: 8,
    });
  });
});

describe('generateDeck', () => {
  for (const n of SUPPORTED_ORDERS) {
    it(`n=${n}: cantidad de cartas y de símbolos por carta`, () => {
      const deck = generateDeck(n);
      const stats = deckStats(n);
      expect(deck).toHaveLength(stats.cards);
      for (const card of deck) {
        expect(card).toHaveLength(stats.symbolsPerCard);
        // sin duplicados dentro de la carta
        expect(new Set(card).size).toBe(card.length);
      }
    });

    it(`n=${n}: cada par de cartas comparte exactamente 1 símbolo`, () => {
      const deck = generateDeck(n);
      expect(validateDeck(deck, { strict: true })).toBe(true);
    });

    it(`n=${n}: usa exactamente n²+n+1 símbolos distintos`, () => {
      const deck = generateDeck(n);
      const stats = deckStats(n);
      const used = new Set<number>();
      for (const card of deck) for (const s of card) used.add(s);
      expect(used.size).toBe(stats.symbols);
      // los IDs están en [0, n²+n]
      const max = Math.max(...used);
      const min = Math.min(...used);
      expect(min).toBe(0);
      expect(max).toBe(stats.symbols - 1);
    });
  }

  it('lanza error con orden no primo', () => {
    expect(() => generateDeck(4)).toThrow();
    expect(() => generateDeck(6)).toThrow();
  });

  it('lanza error con orden inválido', () => {
    expect(() => generateDeck(1)).toThrow();
    expect(() => generateDeck(0)).toThrow();
    expect(() => generateDeck(2.5)).toThrow();
  });
});

describe('remapDeck', () => {
  it('aplica permutación de símbolos preservando la validez', () => {
    const deck = generateDeck(3);
    // mapping invertido
    const mapping = Array.from({ length: 13 }, (_, i) => 12 - i);
    const remapped = remapDeck(deck, mapping);
    expect(validateDeck(remapped)).toBe(true);
  });
});

describe('shuffle', () => {
  it('preserva los elementos', () => {
    const rng = mulberry32(42);
    const original = [0, 1, 2, 3, 4, 5];
    const out = shuffle(original, rng);
    expect(out.slice().sort()).toEqual(original);
  });
  it('no muta el array original', () => {
    const original = [0, 1, 2, 3];
    const copy = original.slice();
    shuffle(original);
    expect(original).toEqual(copy);
  });
});

// PRNG determinista para tests
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
