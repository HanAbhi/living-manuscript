/**
 * Deterministic Pseudorandom Number Generator for reproducible generative art.
 * Based on Mulberry32, an efficient 32-bit PRNG with excellent statistical properties.
 */

export interface PRNG {
  seed: number;
  rawSeed: string | number;
  next(): number;
  range(min: number, max: number): number;
  rangeInt(min: number, max: number): number;
  choice<T>(items: readonly T[]): T;
  boolean(prob?: number): boolean;
  jitter(amount: number): number;
  gaussian(mean?: number, stdDev?: number): number;
  fork(subIndex?: number): PRNG;
}

/**
 * Hashes an arbitrary string into a 32-bit positive integer seed.
 */
export function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

/**
 * Creates a seeded PRNG instance using Mulberry32.
 */
export function createPRNG(seedInput: string | number): PRNG {
  const numericSeed =
    typeof seedInput === 'number'
      ? Math.floor(Math.abs(seedInput)) || 1
      : hashStringToSeed(seedInput);

  let state = numericSeed;

  function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min: number, max: number): number {
    return min + next() * (max - min);
  }

  function rangeInt(min: number, max: number): number {
    return Math.floor(range(min, max + 1));
  }

  function choice<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot select choice from an empty array');
    }
    const idx = Math.floor(next() * items.length);
    return items[Math.min(idx, items.length - 1)];
  }

  function boolean(prob = 0.5): boolean {
    return next() < prob;
  }

  function jitter(amount: number): number {
    return (next() * 2 - 1) * amount;
  }

  // Box-Muller transform for natural organic distributions (e.g. stippling density)
  function gaussian(mean = 0, stdDev = 1): number {
    const u1 = Math.max(1e-12, next());
    const u2 = next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  function fork(subIndex = 1): PRNG {
    // Generates a deterministic child PRNG for sub-motifs or nested zoom levels
    const childSeed = (state ^ Math.imul(subIndex, 2654435761)) >>> 0;
    return createPRNG(childSeed);
  }

  return {
    seed: numericSeed,
    rawSeed: seedInput,
    next,
    range,
    rangeInt,
    choice,
    boolean,
    jitter,
    gaussian,
    fork,
  };
}
