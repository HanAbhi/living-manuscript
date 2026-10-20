/**
 * Symmetry operations for generating botanical mandalas.
 * Supports N-fold rotational symmetry and dihedral (bilateral reflection) symmetry.
 */

import {
  rotateCommands,
  reflectCommands,
  rotatePoint,
  reflectPointAcrossRay,
  type Point,
  type Stroke,
} from './geometry';

export type SymmetryMode = 'rotational' | 'dihedral';

export interface RadialSectorInfo {
  sectors: number;
  sectorAngle: number; // 2 * PI / sectors
  center: Point;
  mode: SymmetryMode;
}

/**
 * Replicates a set of base strokes across N radial sectors.
 * In 'dihedral' mode, strokes are reflected across the sector's bisector axis
 * before rotating, creating organic mirrored pairs.
 */
export function replicateRadialStrokes(
  baseStrokes: Stroke[],
  info: RadialSectorInfo,
  baseRevealIndex = 0
): Stroke[] {
  const { sectors, sectorAngle, center, mode } = info;
  const replicated: Stroke[] = [];
  let revealTracker = baseRevealIndex;

  // Process stroke by stroke so all sectors of a motif appear in harmonic harmony
  for (const base of baseStrokes) {
    for (let k = 0; k < sectors; k++) {
      const angle = k * sectorAngle;

      // 1. Direct rotation
      const rotatedCmds = rotateCommands(base.commands, angle, center);
      const rotatedStipples = base.stipples?.map((s) => {
        const pt = rotatePoint({ x: s.x, y: s.y }, angle, center);
        return {
          ...s,
          x: pt.x,
          y: pt.y,
          revealOrder: revealTracker,
        };
      });

      replicated.push({
        ...base,
        id: `${base.id}_sec_${k}`,
        commands: rotatedCmds,
        stipples: rotatedStipples,
        sectorIndex: k,
        revealOrder: revealTracker++,
      });

      // 2. Dihedral bilateral reflection (if enabled and stroke is not already symmetrical)
      if (mode === 'dihedral') {
        const bisector = angle + sectorAngle / 2;
        const reflectedCmds = reflectCommands(base.commands, bisector, center);
        const reflectedStipples = base.stipples?.map((s) => {
          const pt = reflectPointAcrossRay({ x: s.x, y: s.y }, bisector, center);
          return {
            ...s,
            x: pt.x,
            y: pt.y,
            revealOrder: revealTracker,
          };
        });

        replicated.push({
          ...base,
          id: `${base.id}_sec_${k}_refl`,
          commands: reflectedCmds,
          stipples: reflectedStipples,
          sectorIndex: k,
          revealOrder: revealTracker++,
        });
      }
    }
  }

  return replicated;
}
