/**
 * Botanical Motif Generators for The Living Manuscript.
 * Inspired by historical copperplate engravings, scientific herbarium plates,
 * and fine micron-pen ink drawing on warm vellum.
 *
 * Implements:
 * - Distinctive central medallion with multi-tiered rosette & calyx
 * - Dominant lotus with directional copperplate hatching and double contours
 * - Tapered fern fronds and organic pinnate leaflets
 * - Pointillist seed pods with chiaroscuro stippling
 * - Flowing acanthus/paisley scrolls and curling tendrils
 * - Classical architectural dividers (bead-and-reel, astragal, guilloché scallops)
 * - Restrained outer framing border
 */

import {
  polarToCartesian,
  approximatePathLength,
  addOrganicImperfection,
  type Point,
  type PathCommand,
  type Stroke,
  type StippleDot,
} from './geometry';
import type { PRNG } from './random';

export const INK_COLOR = '#22211C';
export const GRAPHITE_COLOR = '#948B7A';
export const BRASS_ACCENT = '#9E834F';

export interface MotifConfig {
  ringIndex: number;
  innerRadius: number;
  outerRadius: number;
  sectorAngle: number;
  prng: PRNG;
  detailDensity: number; // 0.6 (sparse) to 1.4 (ornate)
  accentColor?: string;
  wobble?: number;
  isHeroRing?: boolean; // If true, enhances silhouette and directional hatching
}

/**
 * Helper to build a smooth circular path using 4 cubic Béziers.
 */
function makeCircleCommands(radius: number, center: Point = { x: 0, y: 0 }): PathCommand[] {
  const k = 0.55228475 * radius;
  return [
    { type: 'M', x: center.x, y: center.y - radius },
    {
      type: 'C',
      cp1x: center.x + k,
      cp1y: center.y - radius,
      cp2x: center.x + radius,
      cp2y: center.y - k,
      x: center.x + radius,
      y: center.y,
    },
    {
      type: 'C',
      cp1x: center.x + radius,
      cp1y: center.y + k,
      cp2x: center.x + k,
      cp2y: center.y + radius,
      x: center.x,
      y: center.y + radius,
    },
    {
      type: 'C',
      cp1x: center.x - k,
      cp1y: center.y + radius,
      cp2x: center.x - radius,
      cp2y: center.y + k,
      x: center.x - radius,
      y: center.y,
    },
    {
      type: 'C',
      cp1x: center.x - radius,
      cp1y: center.y - k,
      cp2x: center.x - k,
      cp2y: center.y - radius,
      x: center.x,
      y: center.y - radius,
    },
    { type: 'Z' },
  ];
}

/**
 * 1. Generates faint graphite construction guides (compass circles and radial spokes).
 */
export function generateConstructionGuides(
  radii: number[],
  sectors: number,
  maxRadius: number,
  center: Point = { x: 0, y: 0 }
): Stroke[] {
  const guides: Stroke[] = [];
  let idCounter = 0;

  // Concentric compass circles
  for (let rIdx = 0; rIdx < radii.length; rIdx++) {
    const r = radii[rIdx];
    const cmds = makeCircleCommands(r, center);

    guides.push({
      id: `guide_circle_${rIdx}`,
      commands: cmds,
      width: 0.28,
      color: GRAPHITE_COLOR,
      opacity: 0.3,
      isGuide: true,
      ringIndex: rIdx,
      revealOrder: idCounter++,
      totalLength: approximatePathLength(cmds),
    });
  }

  // Radial ray guide spokes
  for (let s = 0; s < sectors; s++) {
    const angle = (s * 2 * Math.PI) / sectors;
    const end = polarToCartesian(maxRadius * 1.04, angle, center);
    const cmds: PathCommand[] = [
      { type: 'M', x: center.x, y: center.y },
      { type: 'L', x: end.x, y: end.y },
    ];
    guides.push({
      id: `guide_ray_${s}`,
      commands: cmds,
      width: 0.24,
      color: GRAPHITE_COLOR,
      opacity: 0.22,
      isGuide: true,
      ringIndex: 0,
      revealOrder: idCounter++,
      totalLength: approximatePathLength(cmds),
    });
  }

  return guides;
}

/**
 * 2. Distinctive Central Medallion Core (Bindu, Rosette Calyx & Astragal Collar).
 * Represents the focal seed anchor from which the entire manuscript expands.
 */
export function generateCentralBindu(
  coreRadius: number,
  prng: PRNG,
  center: Point = { x: 0, y: 0 }
): Stroke[] {
  const strokes: Stroke[] = [];
  const wobble = 0.2;
  let revealIndex = 0;

  // A. Solid central ink bindu droplet
  const binduDot: StippleDot[] = [
    { x: center.x, y: center.y, r: coreRadius * 0.24, opacity: 0.98, revealOrder: revealIndex++ },
  ];
  strokes.push({
    id: 'bindu_core',
    commands: [
      { type: 'M', x: center.x, y: center.y - coreRadius * 0.24 },
      { type: 'L', x: center.x + 0.01, y: center.y - coreRadius * 0.24 },
    ],
    width: 0.5,
    color: INK_COLOR,
    opacity: 1,
    ringIndex: 0,
    revealOrder: 0,
    totalLength: 1,
    stipples: binduDot,
  });

  // B. Inner brass/ink hairline ring
  const haloR = coreRadius * 0.42;
  let haloCmds = makeCircleCommands(haloR, center);
  haloCmds = addOrganicImperfection(haloCmds, prng, wobble * 0.5);

  strokes.push({
    id: 'bindu_halo',
    commands: haloCmds,
    width: 0.32,
    color: prng.boolean(0.5) ? BRASS_ACCENT : INK_COLOR,
    opacity: 0.85,
    ringIndex: 0,
    revealOrder: revealIndex++,
    totalLength: approximatePathLength(haloCmds),
  });

  // C. Eight-point star polygon rosette (copperplate medallion geometry)
  const rosetteR = coreRadius * 0.72;
  const starPoints = 8;
  const rosetteCmds: PathCommand[] = [];

  for (let i = 0; i < starPoints; i++) {
    const angTip = (i * 2 * Math.PI) / starPoints;
    const angValley = angTip + Math.PI / starPoints;
    const pTip = polarToCartesian(rosetteR, angTip, center);
    const pValley = polarToCartesian(rosetteR * 0.58, angValley, center);

    if (i === 0) {
      rosetteCmds.push({ type: 'M', x: pTip.x, y: pTip.y });
    } else {
      rosetteCmds.push({ type: 'L', x: pTip.x, y: pTip.y });
    }
    rosetteCmds.push({ type: 'L', x: pValley.x, y: pValley.y });
  }
  rosetteCmds.push({ type: 'Z' });
  const finalRosetteCmds = addOrganicImperfection(rosetteCmds, prng, wobble);

  strokes.push({
    id: 'medallion_rosette',
    commands: finalRosetteCmds,
    width: 0.42,
    color: INK_COLOR,
    opacity: 0.9,
    ringIndex: 0,
    revealOrder: revealIndex++,
    totalLength: approximatePathLength(finalRosetteCmds),
  });

  // D. Outer astragal collar ring
  let collarCmds = makeCircleCommands(coreRadius, center);
  collarCmds = addOrganicImperfection(collarCmds, prng, wobble * 0.6);

  strokes.push({
    id: 'medallion_collar',
    commands: collarCmds,
    width: 0.45,
    color: INK_COLOR,
    opacity: 0.92,
    ringIndex: 0,
    revealOrder: revealIndex++,
    totalLength: approximatePathLength(collarCmds),
  });

  // E. Concentric seed pearls along astragal collar
  const pearlCount = 16;
  const stipples: StippleDot[] = [];
  for (let i = 0; i < pearlCount; i++) {
    const ang = (i * 2 * Math.PI) / pearlCount;
    const pt = polarToCartesian(coreRadius * 0.88, ang, center);
    stipples.push({
      x: pt.x,
      y: pt.y,
      r: prng.range(0.35, 0.55),
      opacity: prng.range(0.8, 0.95),
      revealOrder: revealIndex,
    });
  }

  strokes.push({
    id: 'medallion_pearls',
    commands: [],
    width: 0.3,
    color: prng.boolean(0.35) ? BRASS_ACCENT : INK_COLOR,
    opacity: 0.95,
    ringIndex: 0,
    revealOrder: revealIndex++,
    totalLength: 1,
    stipples,
  });

  return strokes;
}

/**
 * 3. Ornate Lotus Petal with Directional Copperplate Hatching, Double Rims,
 * Spine Vein, and Pointillist Depth.
 */
export function generateLotusPetalMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng, detailDensity, isHeroRing } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.25;
  const span = outerRadius - innerRadius;
  const halfAngle = sectorAngle * 0.47;

  // Base and apex points
  const pBase = polarToCartesian(innerRadius, 0);
  const pApex = polarToCartesian(outerRadius, 0);

  // Outer contour control points
  const cpR = innerRadius + span * 0.55;
  const cpL1 = polarToCartesian(cpR, halfAngle);
  const cpL2 = polarToCartesian(innerRadius + span * 0.84, halfAngle * 0.65);
  const cpR1 = polarToCartesian(cpR, -halfAngle);
  const cpR2 = polarToCartesian(innerRadius + span * 0.84, -halfAngle * 0.65);

  // 1. Primary Outer Contour (crisp hero line weight)
  let outerPetalCmds: PathCommand[] = [
    { type: 'M', x: pBase.x, y: pBase.y },
    {
      type: 'C',
      cp1x: cpL1.x,
      cp1y: cpL1.y,
      cp2x: cpL2.x,
      cp2y: cpL2.y,
      x: pApex.x,
      y: pApex.y,
    },
    {
      type: 'C',
      cp1x: cpR2.x,
      cp1y: cpR2.y,
      cp2x: cpR1.x,
      cp2y: cpR1.y,
      x: pBase.x,
      y: pBase.y,
    },
  ];
  outerPetalCmds = addOrganicImperfection(outerPetalCmds, prng, wobble);

  strokes.push({
    id: `lotus_outer_${ringIndex}`,
    commands: outerPetalCmds,
    width: isHeroRing ? 0.65 : 0.52,
    color: INK_COLOR,
    opacity: 0.96,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(outerPetalCmds),
  });

  // 2. Secondary Inner Contour (engraving double line)
  const innerMargin = span * 0.1;
  const pInnerApex = polarToCartesian(outerRadius - innerMargin, 0);
  const innerHalfAngle = halfAngle * 0.76;
  const icpL1 = polarToCartesian(cpR, innerHalfAngle);
  const icpL2 = polarToCartesian(innerRadius + span * 0.8, innerHalfAngle * 0.6);
  const icpR1 = polarToCartesian(cpR, -innerHalfAngle);
  const icpR2 = polarToCartesian(innerRadius + span * 0.8, -innerHalfAngle * 0.6);

  let innerContourCmds: PathCommand[] = [
    { type: 'M', x: pBase.x, y: pBase.y },
    {
      type: 'C',
      cp1x: icpL1.x,
      cp1y: icpL1.y,
      cp2x: icpL2.x,
      cp2y: icpL2.y,
      x: pInnerApex.x,
      y: pInnerApex.y,
    },
    {
      type: 'C',
      cp1x: icpR2.x,
      cp1y: icpR2.y,
      cp2x: icpR1.x,
      cp2y: icpR1.y,
      x: pBase.x,
      y: pBase.y,
    },
  ];
  innerContourCmds = addOrganicImperfection(innerContourCmds, prng, wobble * 0.7);

  strokes.push({
    id: `lotus_inner_${ringIndex}`,
    commands: innerContourCmds,
    width: 0.32,
    color: INK_COLOR,
    opacity: 0.8,
    ringIndex,
    revealOrder: 1,
    totalLength: approximatePathLength(innerContourCmds),
  });

  // 3. Central Spine Vein (fluted reed)
  let spineCmds: PathCommand[] = [
    { type: 'M', x: pBase.x, y: pBase.y },
    { type: 'L', x: pInnerApex.x, y: pInnerApex.y },
  ];
  spineCmds = addOrganicImperfection(spineCmds, prng, wobble * 0.35);

  strokes.push({
    id: `lotus_spine_${ringIndex}`,
    commands: spineCmds,
    width: 0.38,
    color: INK_COLOR,
    opacity: 0.88,
    ringIndex,
    revealOrder: 2,
    totalLength: approximatePathLength(spineCmds),
  });

  // 4. Directional Copperplate Hatching (fine parallel curved shading along petal flanks)
  const hatchingLines = Math.max(3, Math.round((isHeroRing ? 7 : 4) * detailDensity));
  let hReveal = 3;

  for (let h = 1; h <= hatchingLines; h++) {
    const t = h / (hatchingLines + 1);
    const startR = innerRadius + span * (0.2 + t * 0.65);
    const pSpine = polarToCartesian(startR, 0);

    const endR = startR + span * 0.12 * Math.sin(t * Math.PI);
    const endAng = innerHalfAngle * (0.95 - t * 0.25);

    // Left hatching stroke
    const pEndL = polarToCartesian(endR, endAng);
    const cpL = polarToCartesian(startR + span * 0.06, endAng * 0.35);
    let hCmdsL: PathCommand[] = [
      { type: 'M', x: pSpine.x, y: pSpine.y },
      { type: 'Q', cpx: cpL.x, cpy: cpL.y, x: pEndL.x, y: pEndL.y },
    ];
    hCmdsL = addOrganicImperfection(hCmdsL, prng, wobble * 0.3);

    // Right hatching stroke
    const pEndR = polarToCartesian(endR, -endAng);
    const cpRBranch = polarToCartesian(startR + span * 0.06, -endAng * 0.35);
    let hCmdsR: PathCommand[] = [
      { type: 'M', x: pSpine.x, y: pSpine.y },
      { type: 'Q', cpx: cpRBranch.x, cpy: cpRBranch.y, x: pEndR.x, y: pEndR.y },
    ];
    hCmdsR = addOrganicImperfection(hCmdsR, prng, wobble * 0.3);

    strokes.push({
      id: `lotus_hatch_L_${ringIndex}_${h}`,
      commands: hCmdsL,
      width: 0.18,
      color: INK_COLOR,
      opacity: 0.68,
      ringIndex,
      revealOrder: hReveal++,
      totalLength: approximatePathLength(hCmdsL),
    });

    strokes.push({
      id: `lotus_hatch_R_${ringIndex}_${h}`,
      commands: hCmdsR,
      width: 0.18,
      color: INK_COLOR,
      opacity: 0.68,
      ringIndex,
      revealOrder: hReveal++,
      totalLength: approximatePathLength(hCmdsR),
    });
  }

  // 5. Pointillist Chiaroscuro Stipples at Petal Base
  const stipples: StippleDot[] = [];
  const stippleCount = Math.round((isHeroRing ? 24 : 14) * detailDensity);
  for (let i = 0; i < stippleCount; i++) {
    const rFrac = Math.pow(prng.next(), 2.4);
    const r = innerRadius + span * 0.3 * rFrac;
    const ang = prng.jitter(halfAngle * 0.6 * (1 - rFrac));
    const pt = polarToCartesian(r, ang);
    stipples.push({
      x: pt.x,
      y: pt.y,
      r: prng.range(0.2, 0.42),
      opacity: prng.range(0.4, 0.85) * (1 - rFrac * 0.6),
      revealOrder: hReveal,
    });
  }

  strokes.push({
    id: `lotus_stipple_${ringIndex}`,
    commands: [],
    width: 0.25,
    color: INK_COLOR,
    opacity: 0.9,
    ringIndex,
    revealOrder: hReveal++,
    totalLength: 1,
    stipples,
  });

  return strokes;
}

/**
 * 4. Tapered Fern Frond with Organic Phyllotaxis & Serrated Pinnae.
 */
export function generateFernFrondMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng, detailDensity } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.25;
  const span = outerRadius - innerRadius;

  // Gently arching central rachis (stem)
  const stemBase = polarToCartesian(innerRadius, 0);
  const stemTip = polarToCartesian(outerRadius, sectorAngle * 0.1);
  const cpStem1 = polarToCartesian(innerRadius + span * 0.35, sectorAngle * 0.05);
  const cpStem2 = polarToCartesian(innerRadius + span * 0.72, sectorAngle * 0.14);

  let stemCmds: PathCommand[] = [
    { type: 'M', x: stemBase.x, y: stemBase.y },
    {
      type: 'C',
      cp1x: cpStem1.x,
      cp1y: cpStem1.y,
      cp2x: cpStem2.x,
      cp2y: cpStem2.y,
      x: stemTip.x,
      y: stemTip.y,
    },
  ];
  stemCmds = addOrganicImperfection(stemCmds, prng, wobble * 0.5);

  strokes.push({
    id: `fern_stem_${ringIndex}`,
    commands: stemCmds,
    width: 0.44,
    color: INK_COLOR,
    opacity: 0.92,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(stemCmds),
  });

  // Tapered alternating pinnae (leaflets)
  const leafletPairs = Math.max(3, Math.round(6 * detailDensity));
  for (let i = 1; i <= leafletPairs; i++) {
    const t = i / (leafletPairs + 1);
    // Natural tapering: largest in lower-mid frond, diminishing gracefully to tip
    const leafletLen = span * 0.24 * Math.sin(t * Math.PI) * (1 - t * 0.2);
    const stemPos = polarToCartesian(innerRadius + span * t, sectorAngle * 0.09 * t);

    // Left pinnule
    const leafAngleL = sectorAngle * 0.44;
    const tipL = polarToCartesian(
      innerRadius + span * t + leafletLen * 0.72,
      sectorAngle * 0.09 * t + leafAngleL
    );
    const cpL = polarToCartesian(
      innerRadius + span * t + leafletLen * 0.4,
      sectorAngle * 0.09 * t + leafAngleL * 1.15
    );

    let leafLCmds: PathCommand[] = [
      { type: 'M', x: stemPos.x, y: stemPos.y },
      { type: 'Q', cpx: cpL.x, cpy: cpL.y, x: tipL.x, y: tipL.y },
      {
        type: 'Q',
        cpx: cpL.x * 0.88 + stemPos.x * 0.12,
        cpy: cpL.y * 0.88 + stemPos.y * 0.12,
        x: stemPos.x,
        y: stemPos.y,
      },
    ];
    leafLCmds = addOrganicImperfection(leafLCmds, prng, wobble * 0.45);

    strokes.push({
      id: `fern_leaflet_L_${ringIndex}_${i}`,
      commands: leafLCmds,
      width: 0.28,
      color: INK_COLOR,
      opacity: 0.82,
      ringIndex,
      revealOrder: i,
      totalLength: approximatePathLength(leafLCmds),
    });

    // Right pinnule (offset for alternating phyllotaxis)
    const tOffset = Math.min(0.96, t + 0.035);
    const stemPosR = polarToCartesian(
      innerRadius + span * tOffset,
      sectorAngle * 0.09 * tOffset
    );
    const leafAngleR = -sectorAngle * 0.42;
    const tipR = polarToCartesian(
      innerRadius + span * tOffset + leafletLen * 0.68,
      sectorAngle * 0.09 * tOffset + leafAngleR
    );
    const cpR = polarToCartesian(
      innerRadius + span * tOffset + leafletLen * 0.35,
      sectorAngle * 0.09 * tOffset + leafAngleR * 1.15
    );

    let leafRCmds: PathCommand[] = [
      { type: 'M', x: stemPosR.x, y: stemPosR.y },
      { type: 'Q', cpx: cpR.x, cpy: cpR.y, x: tipR.x, y: tipR.y },
      {
        type: 'Q',
        cpx: cpR.x * 0.88 + stemPosR.x * 0.12,
        cpy: cpR.y * 0.88 + stemPosR.y * 0.12,
        x: stemPosR.x,
        y: stemPosR.y,
      },
    ];
    leafRCmds = addOrganicImperfection(leafRCmds, prng, wobble * 0.45);

    strokes.push({
      id: `fern_leaflet_R_${ringIndex}_${i}`,
      commands: leafRCmds,
      width: 0.28,
      color: INK_COLOR,
      opacity: 0.82,
      ringIndex,
      revealOrder: i + leafletPairs,
      totalLength: approximatePathLength(leafRCmds),
    });
  }

  return strokes;
}

/**
 * 5. Botanical Seed Pod with Contoured Chiaroscuro Stippling & Calyx Crown.
 */
export function generateSeedPodMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng, detailDensity } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.25;
  const span = outerRadius - innerRadius;
  const podWidthAngle = sectorAngle * 0.33;

  // Stalk
  const pStalk = polarToCartesian(innerRadius, 0);
  const pPodBase = polarToCartesian(innerRadius + span * 0.22, 0);

  let stalkCmds: PathCommand[] = [
    { type: 'M', x: pStalk.x, y: pStalk.y },
    { type: 'L', x: pPodBase.x, y: pPodBase.y },
  ];
  stalkCmds = addOrganicImperfection(stalkCmds, prng, wobble * 0.4);

  strokes.push({
    id: `pod_stalk_${ringIndex}`,
    commands: stalkCmds,
    width: 0.48,
    color: INK_COLOR,
    opacity: 0.92,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(stalkCmds),
  });

  // Ovoid pod body
  const pPodCrown = polarToCartesian(innerRadius + span * 0.82, 0);
  const cpL1 = polarToCartesian(innerRadius + span * 0.44, podWidthAngle);
  const cpL2 = polarToCartesian(innerRadius + span * 0.72, podWidthAngle * 0.65);
  const cpR1 = polarToCartesian(innerRadius + span * 0.44, -podWidthAngle);
  const cpR2 = polarToCartesian(innerRadius + span * 0.72, -podWidthAngle * 0.65);

  let podCmds: PathCommand[] = [
    { type: 'M', x: pPodBase.x, y: pPodBase.y },
    {
      type: 'C',
      cp1x: cpL1.x,
      cp1y: cpL1.y,
      cp2x: cpL2.x,
      cp2y: cpL2.y,
      x: pPodCrown.x,
      y: pPodCrown.y,
    },
    {
      type: 'C',
      cp1x: cpR2.x,
      cp1y: cpR2.y,
      cp2x: cpR1.x,
      cp2y: cpR1.y,
      x: pPodBase.x,
      y: pPodBase.y,
    },
  ];
  podCmds = addOrganicImperfection(podCmds, prng, wobble);

  strokes.push({
    id: `pod_body_${ringIndex}`,
    commands: podCmds,
    width: 0.54,
    color: INK_COLOR,
    opacity: 0.96,
    ringIndex,
    revealOrder: 1,
    totalLength: approximatePathLength(podCmds),
  });

  // Star calyx crown
  const crownTip = polarToCartesian(outerRadius, 0);
  const crownL = polarToCartesian(innerRadius + span * 0.9, podWidthAngle * 0.42);
  const crownR = polarToCartesian(innerRadius + span * 0.9, -podWidthAngle * 0.42);

  let crownCmds: PathCommand[] = [
    { type: 'M', x: crownL.x, y: crownL.y },
    { type: 'L', x: crownTip.x, y: crownTip.y },
    { type: 'L', x: crownR.x, y: crownR.y },
  ];
  crownCmds = addOrganicImperfection(crownCmds, prng, wobble * 0.45);

  strokes.push({
    id: `pod_crown_${ringIndex}`,
    commands: crownCmds,
    width: 0.38,
    color: INK_COLOR,
    opacity: 0.88,
    ringIndex,
    revealOrder: 2,
    totalLength: approximatePathLength(crownCmds),
  });

  // Chiaroscuro stipples inside pod body
  const stipples: StippleDot[] = [];
  const dotCount = Math.round(28 * detailDensity);
  for (let i = 0; i < dotCount; i++) {
    const t = prng.range(0.26, 0.78);
    const r = innerRadius + span * t;
    const maxW = Math.sin(((t - 0.22) / 0.6) * Math.PI) * podWidthAngle * 0.72;
    const u = prng.next();
    const sign = prng.boolean() ? 1 : -1;
    const ang = sign * Math.pow(u, 0.65) * maxW;

    const pt = polarToCartesian(r, ang);
    stipples.push({
      x: pt.x,
      y: pt.y,
      r: prng.range(0.22, 0.46),
      opacity: prng.range(0.45, 0.88),
      revealOrder: 3,
    });
  }

  strokes.push({
    id: `pod_stippling_${ringIndex}`,
    commands: [],
    width: 0.25,
    color: INK_COLOR,
    opacity: 0.95,
    ringIndex,
    revealOrder: 3,
    totalLength: 1,
    stipples,
  });

  return strokes;
}

/**
 * 6. Curling Tendrils with Logarithmic Spirals & Foliate Bracts.
 */
export function generateTendrilMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.25;
  const span = outerRadius - innerRadius;

  const pStart = polarToCartesian(innerRadius, -sectorAngle * 0.22);
  const pMid = polarToCartesian(innerRadius + span * 0.58, sectorAngle * 0.08);
  const pCurlCenter = polarToCartesian(innerRadius + span * 0.82, sectorAngle * 0.28);

  const curlCmds: PathCommand[] = [
    { type: 'M', x: pStart.x, y: pStart.y },
    {
      type: 'Q',
      cpx: pMid.x,
      cpy: pMid.y,
      x: pCurlCenter.x,
      y: pCurlCenter.y,
    },
  ];

  // Inward spiral curl
  const spiralSteps = 12;
  let rSp = span * 0.16;
  let currentAng = sectorAngle * 0.28;
  let prevPt = pCurlCenter;

  for (let s = 1; s <= spiralSteps; s++) {
    currentAng += 0.48;
    rSp *= 0.86;
    const nextPt = {
      x: pCurlCenter.x + rSp * Math.cos(currentAng),
      y: pCurlCenter.y + rSp * Math.sin(currentAng),
    };
    curlCmds.push({
      type: 'Q',
      cpx: (prevPt.x + nextPt.x) * 0.5,
      cpy: (prevPt.y + nextPt.y) * 0.5,
      x: nextPt.x,
      y: nextPt.y,
    });
    prevPt = nextPt;
  }

  const finalCmds = addOrganicImperfection(curlCmds, prng, wobble);

  strokes.push({
    id: `tendril_spiral_${ringIndex}`,
    commands: finalCmds,
    width: 0.38,
    color: INK_COLOR,
    opacity: 0.88,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(finalCmds),
  });

  // Terminal seed pearl
  const stipples: StippleDot[] = [
    {
      x: prevPt.x,
      y: prevPt.y,
      r: 0.65,
      opacity: 0.92,
      revealOrder: 1,
    },
  ];

  strokes.push({
    id: `tendril_bead_${ringIndex}`,
    commands: [],
    width: 0.3,
    color: prng.boolean(0.4) ? BRASS_ACCENT : INK_COLOR,
    opacity: 0.92,
    ringIndex,
    revealOrder: 1,
    totalLength: 1,
    stipples,
  });

  return strokes;
}

/**
 * 7. Acanthus / Paisley Flourish with Internal Copperplate Ribs.
 */
export function generatePaisleyMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng, detailDensity } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.25;
  const span = outerRadius - innerRadius;

  const pBase = polarToCartesian(innerRadius, 0);
  const pBelly = polarToCartesian(innerRadius + span * 0.5, sectorAngle * 0.36);
  const pWaist = polarToCartesian(innerRadius + span * 0.74, sectorAngle * 0.12);
  const pApexCurl = polarToCartesian(outerRadius, -sectorAngle * 0.14);

  let paisleyCmds: PathCommand[] = [
    { type: 'M', x: pBase.x, y: pBase.y },
    {
      type: 'C',
      cp1x: pBelly.x,
      cp1y: pBelly.y,
      cp2x: pWaist.x,
      cp2y: pWaist.y,
      x: pApexCurl.x,
      y: pApexCurl.y,
    },
    {
      type: 'C',
      cp1x: pApexCurl.x - span * 0.08,
      cp1y: pApexCurl.y,
      cp2x: polarToCartesian(innerRadius + span * 0.4, -sectorAngle * 0.18).x,
      cp2y: polarToCartesian(innerRadius + span * 0.4, -sectorAngle * 0.18).y,
      x: pBase.x,
      y: pBase.y,
    },
  ];
  paisleyCmds = addOrganicImperfection(paisleyCmds, prng, wobble);

  strokes.push({
    id: `paisley_outer_${ringIndex}`,
    commands: paisleyCmds,
    width: 0.52,
    color: INK_COLOR,
    opacity: 0.95,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(paisleyCmds),
  });

  // Internal curved engraving ribs
  const ribCount = Math.max(3, Math.round(5 * detailDensity));
  for (let r = 1; r <= ribCount; r++) {
    const t = r / (ribCount + 1);
    const rL = innerRadius + span * t * 0.72;
    const p1 = polarToCartesian(rL, sectorAngle * 0.24 * Math.sin(t * Math.PI));
    const p2 = polarToCartesian(rL * 0.94, -sectorAngle * 0.11 * Math.sin(t * Math.PI));

    let ribCmds: PathCommand[] = [
      { type: 'M', x: p1.x, y: p1.y },
      { type: 'L', x: p2.x, y: p2.y },
    ];
    ribCmds = addOrganicImperfection(ribCmds, prng, wobble * 0.4);

    strokes.push({
      id: `paisley_rib_${ringIndex}_${r}`,
      commands: ribCmds,
      width: 0.22,
      color: INK_COLOR,
      opacity: 0.72,
      ringIndex,
      revealOrder: r,
      totalLength: approximatePathLength(ribCmds),
    });
  }

  return strokes;
}

/**
 * 8. Architectural Divider Bands between Concentric Tiers.
 * Styles: 'beads' | 'scallops' | 'chevrons' | 'astragal'
 */
export function generateRingDivider(
  radius: number,
  sectorAngle: number,
  ringIndex: number,
  prng: PRNG,
  style: 'beads' | 'scallops' | 'chevrons' | 'astragal' = 'beads'
): Stroke[] {
  const strokes: Stroke[] = [];
  const wobble = 0.18;

  if (style === 'beads' || style === 'astragal') {
    // Delicate beaded chain along circumference arc
    const beadsPerSector = 6;
    const stipples: StippleDot[] = [];
    for (let b = 0; b < beadsPerSector; b++) {
      const ang = (b / beadsPerSector) * sectorAngle;
      const pt = polarToCartesian(radius, ang);
      stipples.push({
        x: pt.x,
        y: pt.y,
        r: prng.range(0.48, 0.72),
        opacity: prng.range(0.82, 0.96),
        revealOrder: b,
      });
    }

    strokes.push({
      id: `divider_beads_${ringIndex}`,
      commands: [],
      width: 0.3,
      color: prng.boolean(0.3) ? BRASS_ACCENT : INK_COLOR,
      opacity: 0.92,
      ringIndex,
      revealOrder: 0,
      totalLength: 1,
      stipples,
    });
  } else if (style === 'scallops') {
    // Arching guilloché scallop
    const pStart = polarToCartesian(radius, 0);
    const pEnd = polarToCartesian(radius, sectorAngle);
    const pPeak = polarToCartesian(radius + 3.2, sectorAngle * 0.5);

    let scCmds: PathCommand[] = [
      { type: 'M', x: pStart.x, y: pStart.y },
      { type: 'Q', cpx: pPeak.x, cpy: pPeak.y, x: pEnd.x, y: pEnd.y },
    ];
    scCmds = addOrganicImperfection(scCmds, prng, wobble);

    strokes.push({
      id: `divider_scallop_${ringIndex}`,
      commands: scCmds,
      width: 0.36,
      color: INK_COLOR,
      opacity: 0.88,
      ringIndex,
      revealOrder: 0,
      totalLength: approximatePathLength(scCmds),
    });
  } else {
    // Chevrons / zig-zag dentils
    const pStart = polarToCartesian(radius, 0);
    const pMid = polarToCartesian(radius + 2.4, sectorAngle * 0.5);
    const pEnd = polarToCartesian(radius, sectorAngle);

    let chCmds: PathCommand[] = [
      { type: 'M', x: pStart.x, y: pStart.y },
      { type: 'L', x: pMid.x, y: pMid.y },
      { type: 'L', x: pEnd.x, y: pEnd.y },
    ];
    chCmds = addOrganicImperfection(chCmds, prng, wobble);

    strokes.push({
      id: `divider_chevron_${ringIndex}`,
      commands: chCmds,
      width: 0.3,
      color: INK_COLOR,
      opacity: 0.82,
      ringIndex,
      revealOrder: 0,
      totalLength: approximatePathLength(chCmds),
    });
  }

  return strokes;
}

/**
 * 9. Restrained Outer Framing Border & Corona.
 * Elegant double circle with fine dental tick marks and corner pearls
 * that clean and seal the outer perimeter of the manuscript.
 */
export function generateOuterBorder(
  radius: number,
  sectorAngle: number,
  prng: PRNG,
  center: Point = { x: 0, y: 0 }
): Stroke[] {
  const strokes: Stroke[] = [];
  const wobble = 0.18;

  // Outer framing arc
  const pStart = polarToCartesian(radius, 0, center);
  const pMid = polarToCartesian(radius, sectorAngle * 0.5, center);
  const pEnd = polarToCartesian(radius, sectorAngle, center);

  let borderCmds: PathCommand[] = [
    { type: 'M', x: pStart.x, y: pStart.y },
    { type: 'Q', cpx: pMid.x, cpy: pMid.y, x: pEnd.x, y: pEnd.y },
  ];
  borderCmds = addOrganicImperfection(borderCmds, prng, wobble);

  strokes.push({
    id: `outer_border_arc`,
    commands: borderCmds,
    width: 0.55,
    color: INK_COLOR,
    opacity: 0.94,
    ringIndex: 99,
    revealOrder: 0,
    totalLength: approximatePathLength(borderCmds),
  });

  // Inner hairline track
  const pInStart = polarToCartesian(radius - 3.5, 0, center);
  const pInMid = polarToCartesian(radius - 3.5, sectorAngle * 0.5, center);
  const pInEnd = polarToCartesian(radius - 3.5, sectorAngle, center);

  let innerTrackCmds: PathCommand[] = [
    { type: 'M', x: pInStart.x, y: pInStart.y },
    { type: 'Q', cpx: pInMid.x, cpy: pInMid.y, x: pInEnd.x, y: pInEnd.y },
  ];
  innerTrackCmds = addOrganicImperfection(innerTrackCmds, prng, wobble);

  strokes.push({
    id: `outer_border_track`,
    commands: innerTrackCmds,
    width: 0.28,
    color: INK_COLOR,
    opacity: 0.75,
    ringIndex: 99,
    revealOrder: 1,
    totalLength: approximatePathLength(innerTrackCmds),
  });

  // Terminal jewel bead at sector node
  const stipples: StippleDot[] = [
    {
      x: pEnd.x,
      y: pEnd.y,
      r: 0.75,
      opacity: 0.92,
      revealOrder: 2,
    },
  ];

  strokes.push({
    id: `outer_border_bead`,
    commands: [],
    width: 0.3,
    color: prng.boolean(0.4) ? BRASS_ACCENT : INK_COLOR,
    opacity: 0.92,
    ringIndex: 99,
    revealOrder: 2,
    totalLength: 1,
    stipples,
  });

  return strokes;
}
