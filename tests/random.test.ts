import { describe, it, expect } from 'vitest';
import { createPRNG, hashStringToSeed } from '../src/engine/random';

describe('PRNG - Mulberry32 deterministic generator', () => {
  it('produces identical sequences for the same numeric seed', () => {
    const prng1 = createPRNG(4242);
    const prng2 = createPRNG(4242);

    const seq1 = [prng1.next(), prng1.next(), prng1.next(), prng1.range(10, 50)];
    const seq2 = [prng2.next(), prng2.next(), prng2.next(), prng2.range(10, 50)];

    expect(seq1).toEqual(seq2);
  });

  it('produces identical sequences for the same string seed', () => {
    const prng1 = createPRNG('BOTANICAL_SPECIMEN_007');
    const prng2 = createPRNG('BOTANICAL_SPECIMEN_007');

    const seq1 = [prng1.rangeInt(1, 100), prng1.choice(['A', 'B', 'C']), prng1.boolean()];
    const seq2 = [prng2.rangeInt(1, 100), prng2.choice(['A', 'B', 'C']), prng2.boolean()];

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for distinct seeds', () => {
    const prng1 = createPRNG('SEED_ALPHA');
    const prng2 = createPRNG('SEED_OMEGA');

    expect(prng1.next()).not.toEqual(prng2.next());
  });

  it('correctly hashes strings deterministically', () => {
    const h1 = hashStringToSeed('LOTUS-432');
    const h2 = hashStringToSeed('LOTUS-432');
    expect(h1).toBe(h2);
    expect(h1).toBeGreaterThan(0);
  });

  it('fork produces deterministic child PRNG streams', () => {
    const parent1 = createPRNG(999);
    const parent2 = createPRNG(999);

    const child1 = parent1.fork(3);
    const child2 = parent2.fork(3);

    expect(child1.next()).toBe(child2.next());
  });
});
