/**
 * Hierarchical Scene Generator and Composition Grammar for The Living Manuscript.
 * Establishes classical engraving proportions: distinctive central medallion,
 * inner floral calyx, dominant hero botanical ring, contrasting foliage, fine dividers,
 * and a restrained outer framing border.
 */

import type { Stroke, Point } from './geometry';
import { createPRNG } from './random';
import { replicateRadialStrokes } from './symmetry';
import {
  generateConstructionGuides,
  generateCentralBindu,
  generateLotusPetalMotif,
  generateFernFrondMotif,
  generateSeedPodMotif,
  generateTendrilMotif,
  generatePaisleyMotif,
  generateRingDivider,
  generateOuterBorder,
} from './botanicals';

export type CompositionPreset = 'sparse' | 'ornate' | 'wild';
export type MotifType = 'lotus' | 'fern' | 'seedPod' | 'tendril' | 'paisley';

export const MEDALLION_CORE_RATIO = 0.12; // Radius fraction of the central medallion aperture
export const SEAMLESS_ZOOM_RATIO = 1 / MEDALLION_CORE_RATIO; // ~8.333333x for continuous infinite zoom

export interface MandalaConfig {
  seed: string | number;
  sectors?: number; // 8, 12, 16, 24
  detailDensity?: number; // 0.6 to 1.4
  preset?: CompositionPreset;
  ringCount?: number;
  baseRadius?: number;
  center?: Point;
  depthLevel?: number;
}

export interface MandalaScene {
  seed: string | number;
  numericSeed: number;
  sectors: number;
  preset: CompositionPreset;
  detailDensity: number;
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
  heroRingIndex: number;
}

/**
 * Generates a complete, deterministic mandala composition obeying classical engraving grammar.
 */
export function generateMandalaScene(config: MandalaConfig): MandalaScene {
  const prng = createPRNG(config.seed);
  const center = config.center ?? { x: 0, y: 0 };
  const depthLevel = config.depthLevel ?? 0;
  const preset: CompositionPreset = config.preset ?? 'ornate';

  // Sector selection based on preset and user preference
  const allowedSectors = [8, 12, 16, 24];
  let defaultSectors = 16;
  if (preset === 'sparse') {
    defaultSectors = prng.choice([8, 12]);
  } else if (preset === 'wild') {
    defaultSectors = prng.choice([12, 16]);
  } else {
    defaultSectors = prng.choice([16, 24]);
  }

  const sectors =
    config.sectors && allowedSectors.includes(config.sectors)
      ? config.sectors
      : defaultSectors;

  const sectorAngle = (2 * Math.PI) / sectors;

  // Detail density governed by preset
  const userDensity = config.detailDensity ?? 1.0;
  let densityMultiplier = 1.0;
  if (preset === 'sparse') {
    densityMultiplier = 0.82;
  } else if (preset === 'ornate') {
    densityMultiplier = 1.15;
  } else if (preset === 'wild') {
    densityMultiplier = 1.02;
  }
  const effectiveDensity = Math.max(0.5, Math.min(1.5, userDensity * densityMultiplier));

  const baseScale = config.baseRadius ?? 210;

  // Proportional radial layout:
  // R0: Central Medallion Core (0.12)
  // R1: Inner Floral Calyx (0.28)
  // R2: Architectural Divider Frieze (0.36)
  // R3: Dominant Hero Floral Ring (0.70) - 34% width hero centerpiece!
  // R4: Contrasting Botanical Foliage (0.88)
  // R5: Restrained Outer Border (1.00)
  const radii: number[] = [
    baseScale * MEDALLION_CORE_RATIO, // R0: Medallion core
    baseScale * 0.28,                 // R1: Inner calyx
    baseScale * 0.36,                 // R2: Intermediate divider
    baseScale * 0.70,                 // R3: Hero dominant ring
    baseScale * 0.88,                 // R4: Contrasting ring
    baseScale * 1.00,                 // R5: Outer border
  ];
  const maxRadius = radii[radii.length - 1];
  const heroRingIndex = 3; // The tier between radii[2] and radii[3]

  // 1. Generate faint graphite compass and ray construction guides
  const guideStrokes = generateConstructionGuides(radii, sectors, maxRadius, center);

  // 2. Motif selection curated for visual contrast and narrative hierarchy
  const ringMotifs: MotifType[] = [];

  if (preset === 'sparse') {
    ringMotifs.push('lotus');    // R1: delicate lotus core
    ringMotifs.push('fern');     // R3: hero fronds
    ringMotifs.push('seedPod');  // R4: quiet seed pods
  } else if (preset === 'wild') {
    ringMotifs.push('fern');     // R1: arching fronds
    ringMotifs.push(prng.boolean(0.6) ? 'paisley' : 'lotus'); // R3: flowing acanthus hero
    ringMotifs.push('tendril');  // R4: wild spiraling tendrils
  } else {
    // 'ornate' (Manuscript Masterpiece)
    ringMotifs.push('lotus');    // R1: inner rosette
    ringMotifs.push('lotus');    // R3: majestic copperplate hero lotus
    ringMotifs.push(prng.choice(['fern', 'seedPod', 'paisley'] as MotifType[])); // R4: contrasting tier
  }

  const inkStrokes: Stroke[] = [];
  let globalRevealIndex = guideStrokes.length;

  // 3. Distinctive Central Medallion (Core bindu, star rosette, astragal collar)
  const binduStrokes = generateCentralBindu(radii[0], prng, center);
  for (const s of binduStrokes) {
    s.revealOrder = globalRevealIndex++;
    inkStrokes.push(s);
  }

  // 4. Tier 1: Inner Floral Calyx (radii[0] -> radii[1])
  const t1Prng = prng.fork(1);
  const t1Motif = ringMotifs[0];
  const t1Config = {
    ringIndex: 1,
    innerRadius: radii[0],
    outerRadius: radii[1],
    sectorAngle,
    prng: t1Prng,
    detailDensity: effectiveDensity * 0.9,
    wobble: 0.22,
    isHeroRing: false,
  };
  const baseT1 = t1Motif === 'lotus'
    ? generateLotusPetalMotif(t1Config)
    : generateFernFrondMotif(t1Config);
  const repT1 = replicateRadialStrokes(baseT1, { sectors, sectorAngle, center, mode: 'rotational' }, globalRevealIndex);
  globalRevealIndex += repT1.length;
  inkStrokes.push(...repT1);

  // 5. Tier 2: Intermediate Architectural Divider Frieze (radii[1] -> radii[2])
  const divPrng = prng.fork(2);
  const dividerStyle = preset === 'sparse' ? 'scallops' : prng.choice(['beads', 'astragal', 'scallops'] as const);
  const baseDiv = generateRingDivider(radii[2], sectorAngle, 2, divPrng, dividerStyle);
  const repDiv = replicateRadialStrokes(baseDiv, { sectors, sectorAngle, center, mode: 'rotational' }, globalRevealIndex);
  globalRevealIndex += repDiv.length;
  inkStrokes.push(...repDiv);

  // 6. Tier 3: DOMINANT HERO FLORAL RING (radii[2] -> radii[3])
  // The grand centerpiece with high silhouette impact & directional hatching
  const heroPrng = prng.fork(3);
  const heroMotif = ringMotifs[1];
  const heroConfig = {
    ringIndex: 3,
    innerRadius: radii[2],
    outerRadius: radii[3],
    sectorAngle,
    prng: heroPrng,
    detailDensity: effectiveDensity * 1.1,
    wobble: 0.25,
    isHeroRing: true,
  };

  let baseHero: Stroke[] = [];
  if (heroMotif === 'lotus') {
    baseHero = generateLotusPetalMotif(heroConfig);
  } else if (heroMotif === 'paisley') {
    baseHero = generatePaisleyMotif(heroConfig);
  } else if (heroMotif === 'seedPod') {
    baseHero = generateSeedPodMotif(heroConfig);
  } else {
    baseHero = generateFernFrondMotif(heroConfig);
  }
  const repHero = replicateRadialStrokes(baseHero, { sectors, sectorAngle, center, mode: 'rotational' }, globalRevealIndex);
  globalRevealIndex += repHero.length;
  inkStrokes.push(...repHero);

  // 7. Tier 4: Contrasting Botanical Foliage Ring (radii[3] -> radii[4])
  const foilPrng = prng.fork(4);
  const foilMotif = ringMotifs[2];
  const foilConfig = {
    ringIndex: 4,
    innerRadius: radii[3],
    outerRadius: radii[4],
    sectorAngle,
    prng: foilPrng,
    detailDensity: effectiveDensity,
    wobble: 0.25,
    isHeroRing: false,
  };

  let baseFoil: Stroke[] = [];
  if (foilMotif === 'tendril') {
    baseFoil = generateTendrilMotif(foilConfig);
  } else if (foilMotif === 'fern') {
    baseFoil = generateFernFrondMotif(foilConfig);
  } else if (foilMotif === 'seedPod') {
    baseFoil = generateSeedPodMotif(foilConfig);
  } else {
    baseFoil = generatePaisleyMotif(foilConfig);
  }
  const repFoil = replicateRadialStrokes(baseFoil, { sectors, sectorAngle, center, mode: 'rotational' }, globalRevealIndex);
  globalRevealIndex += repFoil.length;
  inkStrokes.push(...repFoil);

  // 8. Tier 5: Restrained Outer Framing Border & Corona (radii[4] -> radii[5])
  const borderPrng = prng.fork(5);
  const baseBorder = generateOuterBorder(radii[5], sectorAngle, borderPrng, center);
  const repBorder = replicateRadialStrokes(baseBorder, { sectors, sectorAngle, center, mode: 'rotational' }, globalRevealIndex);
  globalRevealIndex += repBorder.length;
  inkStrokes.push(...repBorder);

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
    preset,
    detailDensity: userDensity,
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
    heroRingIndex,
  };
}

/**
 * Creates a nested sub-scene centered inside the current mandala core for continuous infinite zoom.
 * Preserves user settings (preset, detailDensity, sectors preference) across zoom depths.
 */
export function generateNestedScene(
  parentScene: MandalaScene,
  depthLevel: number
): MandalaScene {
  const childSeed = `${parentScene.seed}-depth-${depthLevel}`;
  // Preserve sector count if user picked a specific one, or allow harmonic variation
  const sectors = parentScene.sectors;

  return generateMandalaScene({
    seed: childSeed,
    sectors,
    preset: parentScene.preset,
    detailDensity: parentScene.detailDensity,
    baseRadius: parentScene.maxRadius,
    center: parentScene.center,
    depthLevel,
  });
}
