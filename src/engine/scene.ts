/**
 * Scene generator and hierarchical scene graph for The Living Manuscript.
 * Assembles botanical motifs into concentric tiers, replicates across radial sectors,
 * and maintains nested scene levels for infinite zoom transitions.
 */

import type { Stroke, Point } from './geometry';
import { createPRNG } from './random';
import { replicateRadialStrokes, type RadialSectorInfo } from './symmetry';
import {
  generateConstructionGuides,
  generateCentralBindu,
  generateLotusPetalMotif,
  generateFernFrondMotif,
  generateSeedPodMotif,
  generateTendrilMotif,
  generatePaisleyMotif,
  generateRingDivider,
} from './botanicals';

export type MotifType = 'lotus' | 'fern' | 'seedPod' | 'tendril' | 'paisley';

export interface MandalaConfig {
  seed: string | number;
  sectors?: number; // 8, 12, 16, 24
  detailDensity?: number; // 0.7 to 1.4
  ringCount?: number;
  baseRadius?: number;
  center?: Point;
  depthLevel?: number;
}

export interface MandalaScene {
  seed: string | number;
  numericSeed: number;
  sectors: number;
  depthLevel: number;
  center: Point;
  radii: number[];
  motifs: MotifType[];
  strokes: Stroke[];
  guideStrokes: Stroke[];
  inkStrokes: Stroke[];
  totalInkLength: number;
  totalStipples: number;
  maxRadius: number;
}

/**
 * Generates a complete, deterministic mandala scene.
 */
export function generateMandalaScene(config: MandalaConfig): MandalaScene {
  const prng = createPRNG(config.seed);
  const center = config.center ?? { x: 0, y: 0 };
  const depthLevel = config.depthLevel ?? 0;

  // Determine radial sector count (8, 12, 16, or 24)
  const allowedSectors = [8, 12, 16, 24];
  const sectors =
    config.sectors && allowedSectors.includes(config.sectors)
      ? config.sectors
      : prng.choice(allowedSectors);

  const sectorAngle = (2 * Math.PI) / sectors;
  const detailDensity = config.detailDensity ?? 1.0;

  // Concentric ring radii layout
  // Reference unit scale: inner core ~18px, outer ring ~210px
  const baseScale = config.baseRadius ?? 210;
  const ringCount = config.ringCount ?? 4;

  const radii: number[] = [baseScale * 0.08]; // Core bindu radius
  const stepFraction = 0.92 / ringCount;
  for (let r = 1; r <= ringCount; r++) {
    radii.push(baseScale * (0.08 + r * stepFraction));
  }
  const maxRadius = radii[radii.length - 1];

  // 1. Generate faint construction guides
  const guideStrokes = generateConstructionGuides(radii, sectors, maxRadius, center);

  // 2. Motif selection for each concentric ring
  const availableMotifs: MotifType[] = ['lotus', 'fern', 'seedPod', 'tendril', 'paisley'];
  const ringMotifs: MotifType[] = [];

  // Ring 1 is almost always a serene Lotus or Fern to form the sacred heart
  ringMotifs.push(prng.boolean(0.65) ? 'lotus' : 'fern');

  // Outer rings get varied botanical motifs
  for (let r = 1; r < ringCount; r++) {
    const candidates = availableMotifs.filter((m) => m !== ringMotifs[r - 1]);
    ringMotifs.push(prng.choice(candidates));
  }

  const inkStrokes: Stroke[] = [];
  let globalRevealIndex = guideStrokes.length;

  // 3. Central bindu & floret (Ring 0)
  const binduStrokes = generateCentralBindu(radii[0], prng, center);
  for (const s of binduStrokes) {
    s.revealOrder = globalRevealIndex++;
    inkStrokes.push(s);
  }

  // 4. Generate each concentric ring tier
  for (let r = 0; r < ringCount; r++) {
    const innerR = radii[r];
    const outerR = radii[r + 1];
    const motifType = ringMotifs[r];
    const motifPrng = prng.fork(r + 1);

    const motifConfig = {
      ringIndex: r + 1,
      innerRadius: innerR,
      outerRadius: outerR,
      sectorAngle,
      prng: motifPrng,
      detailDensity,
      wobble: 0.28,
    };

    // Generate base motif in local coordinates
    let baseMotifStrokes: Stroke[] = [];
    switch (motifType) {
      case 'lotus':
        baseMotifStrokes = generateLotusPetalMotif(motifConfig);
        break;
      case 'fern':
        baseMotifStrokes = generateFernFrondMotif(motifConfig);
        break;
      case 'seedPod':
        baseMotifStrokes = generateSeedPodMotif(motifConfig);
        break;
      case 'tendril':
        baseMotifStrokes = generateTendrilMotif(motifConfig);
        break;
      case 'paisley':
        baseMotifStrokes = generatePaisleyMotif(motifConfig);
        break;
    }

    // Replicate base motif across all sectors
    const sectorInfo: RadialSectorInfo = {
      sectors,
      sectorAngle,
      center,
      mode: motifType === 'lotus' || motifType === 'seedPod' ? 'rotational' : 'rotational',
    };

    const replicated = replicateRadialStrokes(baseMotifStrokes, sectorInfo, globalRevealIndex);
    globalRevealIndex += replicated.length;
    inkStrokes.push(...replicated);

    // Add decorative divider band between rings
    if (r < ringCount - 1) {
      const dividerStyle = motifPrng.choice(['beads', 'scallops', 'chevrons'] as const);
      const baseDivider = generateRingDivider(outerR, sectorAngle, r + 1, motifPrng, dividerStyle);
      const divInfo: RadialSectorInfo = {
        sectors,
        sectorAngle,
        center,
        mode: 'rotational',
      };
      const divReplicated = replicateRadialStrokes(baseDivider, divInfo, globalRevealIndex);
      globalRevealIndex += divReplicated.length;
      inkStrokes.push(...divReplicated);
    }
  }

  // Calculate statistics
  let totalInkLength = 0;
  let totalStipples = 0;
  for (const s of inkStrokes) {
    totalInkLength += s.totalLength;
    if (s.stipples) {
      totalStipples += s.stipples.length;
    }
  }

  const allStrokes = [...guideStrokes, ...inkStrokes];

  return {
    seed: config.seed,
    numericSeed: prng.seed,
    sectors,
    depthLevel,
    center,
    radii,
    motifs: ringMotifs,
    strokes: allStrokes,
    guideStrokes,
    inkStrokes,
    totalInkLength,
    totalStipples,
    maxRadius,
  };
}

/**
 * Creates a nested sub-scene centered inside the current mandala core for infinite zoom.
 * Uses a deterministic child seed so it always aligns perfectly.
 */
export function generateNestedScene(
  parentScene: MandalaScene,
  depthLevel: number
): MandalaScene {
  const childSeed = `${parentScene.seed}-depth-${depthLevel}`;
  const parentPrng = createPRNG(parentScene.numericSeed);
  const childPrng = parentPrng.fork(depthLevel * 107);

  const allowedSectors = [8, 12, 16, 24];
  const sectors = childPrng.choice(allowedSectors);

  return generateMandalaScene({
    seed: childSeed,
    sectors,
    baseRadius: parentScene.maxRadius,
    center: parentScene.center,
    depthLevel,
  });
}
