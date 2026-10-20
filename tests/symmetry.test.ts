import { describe, it, expect } from 'vitest';
import { Stroke } from '../src/engine/geometry';
import { replicateRadialStrokes, RadialSectorInfo } from '../src/engine/symmetry';

describe('Symmetry Engine - Radial Replication', () => {
  const dummyStroke: Stroke = {
    id: 'test_stroke',
    commands: [
      { type: 'M', x: 10, y: 0 },
      { type: 'L', x: 50, y: 10 },
    ],
    width: 0.5,
    ringIndex: 1,
    revealOrder: 0,
    totalLength: 41.23,
    stipples: [{ x: 30, y: 5, r: 0.5, opacity: 0.8, revealOrder: 0 }],
  };

  it('replicates strokes exactly N times for N-fold rotational symmetry', () => {
    const sectors = 12;
    const info: RadialSectorInfo = {
      sectors,
      sectorAngle: (2 * Math.PI) / sectors,
      center: { x: 0, y: 0 },
      mode: 'rotational',
    };

    const replicated = replicateRadialStrokes([dummyStroke], info, 0);
    expect(replicated.length).toBe(sectors);
    expect(replicated[0].sectorIndex).toBe(0);
    expect(replicated[11].sectorIndex).toBe(11);
  });

  it('replicates strokes 2N times for dihedral symmetry (rotational + bilateral reflection)', () => {
    const sectors = 8;
    const info: RadialSectorInfo = {
      sectors,
      sectorAngle: (2 * Math.PI) / sectors,
      center: { x: 0, y: 0 },
      mode: 'dihedral',
    };

    const replicated = replicateRadialStrokes([dummyStroke], info, 0);
    expect(replicated.length).toBe(sectors * 2);
  });

  it('rotates stipple coordinates in harmony with path commands', () => {
    const sectors = 4;
    const info: RadialSectorInfo = {
      sectors,
      sectorAngle: Math.PI / 2, // 90 deg
      center: { x: 0, y: 0 },
      mode: 'rotational',
    };

    const replicated = replicateRadialStrokes([dummyStroke], info, 0);
    expect(replicated[1].stipples).toBeDefined();
    const stipple1 = replicated[1].stipples![0];
    // Original stipple was (30, 5), rotated by 90 deg around (0,0) -> (-5, 30)
    expect(stipple1.x).toBeCloseTo(-5, 1);
    expect(stipple1.y).toBeCloseTo(30, 1);
  });
});
