import { describe, it, expect } from 'vitest';
import {
  evalQuadraticBezier,
  sliceQuadraticBezier,
  approximatePathLength,
  slicePathByProgress,
  addOrganicImperfection,
  PathCommand,
} from '../src/engine/geometry';
import { createPRNG } from '../src/engine/random';

describe('Geometry Engine - Quadratic Bézier & Progressive Slicing', () => {
  it('correctly evaluates midpoint of quadratic Bézier curve', () => {
    const p0 = { x: 0, y: 0 };
    const cp = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };

    const mid = evalQuadraticBezier(p0, cp, p1, 0.5);
    // At t=0.5: x = 0.25*0 + 0.5*50 + 0.25*100 = 50
    // y = 0.25*0 + 0.5*100 + 0.25*0 = 50
    expect(mid.x).toBeCloseTo(50, 4);
    expect(mid.y).toBeCloseTo(50, 4);
  });

  it('slices quadratic Bézier curve at split parameter using de Casteljau', () => {
    const p0 = { x: 0, y: 0 };
    const cp = { x: 50, y: 100 };
    const p1 = { x: 100, y: 0 };

    const sliced = sliceQuadraticBezier(p0, cp, p1, 0.5);
    expect(sliced.end.x).toBeCloseTo(50, 4);
    expect(sliced.end.y).toBeCloseTo(50, 4);
    expect(sliced.cp.x).toBeCloseTo(25, 4);
    expect(sliced.cp.y).toBeCloseTo(50, 4);
  });

  it('accurately computes approximate arc length for quadratic path', () => {
    const cmds: PathCommand[] = [
      { type: 'M', x: 0, y: 0 },
      { type: 'Q', cpx: 0, cpy: 50, x: 100, y: 50 },
    ];
    const len = approximatePathLength(cmds);
    expect(len).toBeGreaterThan(100);
  });

  it('progressively truncates quadratic Bézier commands in slicePathByProgress', () => {
    const cmds: PathCommand[] = [
      { type: 'M', x: 0, y: 0 },
      { type: 'Q', cpx: 50, cpy: 100, x: 100, y: 0 },
    ];
    const totalLen = approximatePathLength(cmds);

    // At progress 0 -> empty
    expect(slicePathByProgress(cmds, 0, totalLen)).toHaveLength(0);

    // At progress 0.5 -> M and sliced Q
    const sliced = slicePathByProgress(cmds, 0.5, totalLen);
    expect(sliced).toHaveLength(2);
    expect(sliced[0].type).toBe('M');
    expect(sliced[1].type).toBe('Q');
    if (sliced[1].type === 'Q') {
      expect(sliced[1].x).toBeCloseTo(50, 0); // ~midpoint
    }

    // At progress 1.0 -> returns original
    expect(slicePathByProgress(cmds, 1.0, totalLen)).toEqual(cmds);
  });

  it('preserves start and end point alignment for closed loops in addOrganicImperfection', () => {
    const prng = createPRNG('TEST_LOOP');
    const closedCommands: PathCommand[] = [
      { type: 'M', x: 20, y: 30 },
      { type: 'L', x: 60, y: 30 },
      { type: 'L', x: 40, y: 80 },
      { type: 'L', x: 20, y: 30 },
      { type: 'Z' },
    ];

    const wobbled = addOrganicImperfection(closedCommands, prng, 0.4);
    const startCmd = wobbled[0];
    const endLineCmd = wobbled[3];

    expect(startCmd.type).toBe('M');
    expect(endLineCmd.type).toBe('L');
    if (startCmd.type === 'M' && endLineCmd.type === 'L') {
      expect(startCmd.x).toBeCloseTo(endLineCmd.x, 4);
      expect(startCmd.y).toBeCloseTo(endLineCmd.y, 4);
    }
  });
});
