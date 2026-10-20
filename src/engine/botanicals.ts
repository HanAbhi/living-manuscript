/**
 * Botanical Motif Generators for The Living Manuscript.
 * Generates lotus petals, leaf fronds, branching veins, curling tendrils,
 * stippled seed pods, paisleys, and ornamental dividing bands in local coordinates.
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

export const INK_COLOR = '#26251F';
export const GRAPHITE_COLOR = '#9B907C';
export const BRASS_ACCENT = '#A28A58';

export interface MotifConfig {
  ringIndex: number;
  innerRadius: number;
  outerRadius: number;
  sectorAngle: number;
  prng: PRNG;
  detailDensity: number; // 0.5 (sparse) to 1.5 (dense)
  accentColor?: string;
  wobble?: number;
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
    // Circle as 4 cubic bezier segments
    const k = 0.5522847498 * r;
    const cmds: PathCommand[] = [
      { type: 'M', x: center.x, y: center.y - r },
      {
        type: 'C',
        cp1x: center.x + k,
        cp1y: center.y - r,
        cp2x: center.x + r,
        cp2y: center.y - k,
        x: center.x + r,
        y: center.y,
      },
      {
        type: 'C',
        cp1x: center.x + r,
        cp1y: center.y + k,
        cp2x: center.x + k,
        cp2y: center.y + r,
        x: center.x,
        y: center.y + r,
      },
      {
        type: 'C',
        cp1x: center.x - k,
        cp1y: center.y + r,
        cp2x: center.x - r,
        cp2y: center.y + k,
        x: center.x - r,
        y: center.y,
      },
      {
        type: 'C',
        cp1x: center.x - r,
        cp1y: center.y - k,
        cp2x: center.x - k,
        cp2y: center.y - r,
        x: center.x,
        y: center.y - r,
      },
      { type: 'Z' },
    ];

    guides.push({
      id: `guide_circle_${rIdx}`,
      commands: cmds,
      width: 0.3,
      color: GRAPHITE_COLOR,
      opacity: 0.35,
      isGuide: true,
      ringIndex: rIdx,
      revealOrder: idCounter++,
      totalLength: approximatePathLength(cmds),
    });
  }

  // Radial rays
  for (let s = 0; s < sectors; s++) {
    const angle = (s * 2 * Math.PI) / sectors;
    const end = polarToCartesian(maxRadius * 1.05, angle, center);
    const cmds: PathCommand[] = [
      { type: 'M', x: center.x, y: center.y },
      { type: 'L', x: end.x, y: end.y },
    ];
    guides.push({
      id: `guide_ray_${s}`,
      commands: cmds,
      width: 0.25,
      color: GRAPHITE_COLOR,
      opacity: 0.25,
      isGuide: true,
      ringIndex: 0,
      revealOrder: idCounter++,
      totalLength: approximatePathLength(cmds),
    });
  }

  return guides;
}

/**
 * 2. Generates the central bindu and innermost floret.
 */
export function generateCentralBindu(
  coreRadius: number,
  prng: PRNG,
  center: Point = { x: 0, y: 0 }
): Stroke[] {
  const strokes: Stroke[] = [];
  const wobble = 0.2;

  // Solid central ink drop (bindu)
  const binduDot: StippleDot[] = [
    { x: center.x, y: center.y, r: coreRadius * 0.35, opacity: 0.95, revealOrder: 0 },
  ];
  strokes.push({
    id: 'bindu_core',
    commands: [
      { type: 'M', x: center.x, y: center.y - coreRadius * 0.35 },
      { type: 'L', x: center.x + 0.01, y: center.y - coreRadius * 0.35 },
    ],
    width: 0.5,
    color: INK_COLOR,
    opacity: 1,
    ringIndex: 0,
    revealOrder: 0,
    totalLength: 1,
    stipples: binduDot,
  });

  // Concentric fine ring around bindu
  const ringR = coreRadius * 0.65;
  const k = 0.55228475 * ringR;
  let ringCmds: PathCommand[] = [
    { type: 'M', x: center.x, y: center.y - ringR },
    {
      type: 'C',
      cp1x: center.x + k,
      cp1y: center.y - ringR,
      cp2x: center.x + rRing(),
      cp2y: center.y - k,
      x: center.x + ringR,
      y: center.y,
    },
    {
      type: 'C',
      cp1x: center.x + ringR,
      cp1y: center.y + k,
      cp2x: center.x + k,
      cp2y: center.y + ringR,
      x: center.x,
      y: center.y + ringR,
    },
    {
      type: 'C',
      cp1x: center.x - k,
      cp1y: center.y + ringR,
      cp2x: center.x - ringR,
      cp2y: center.y + k,
      x: center.x - ringR,
      y: center.y,
    },
    {
      type: 'C',
      cp1x: center.x - ringR,
      cp1y: center.y - k,
      cp2x: center.x - k,
      cp2y: center.y - ringR,
      x: center.x,
      y: center.y - ringR,
    },
    { type: 'Z' },
  ];
  function rRing() {
    return ringR;
  }
  ringCmds = addOrganicImperfection(ringCmds, prng, wobble);

  strokes.push({
    id: 'bindu_halo',
    commands: ringCmds,
    width: 0.4,
    color: prng.boolean(0.3) ? BRASS_ACCENT : INK_COLOR,
    opacity: 0.85,
    ringIndex: 0,
    revealOrder: 1,
    totalLength: approximatePathLength(ringCmds),
  });

  // Radiating stipple crown around bindu
  const stipples: StippleDot[] = [];
  const dotCount = 16;
  const stippleRadius = coreRadius * 0.95;
  for (let i = 0; i < dotCount; i++) {
    const ang = (i * 2 * Math.PI) / dotCount;
    const pt = polarToCartesian(stippleRadius + prng.jitter(0.5), ang, center);
    stipples.push({
      x: pt.x,
      y: pt.y,
      r: prng.range(0.35, 0.65),
      opacity: prng.range(0.7, 0.95),
      revealOrder: 2,
    });
  }

  strokes.push({
    id: 'bindu_stipples',
    commands: [],
    width: 0.4,
    color: INK_COLOR,
    opacity: 1,
    ringIndex: 0,
    revealOrder: 2,
    totalLength: 1,
    stipples,
  });

  return strokes;
}

/**
 * 3. Generates an ornate Lotus Petal with double contour, spine vein,
 * branching lateral capillaries, and base stippling.
 * Generated symmetrically centered on the positive X-axis in local polar coordinates.
 */
export function generateLotusPetalMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng, detailDensity } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.3;
  const petalSpan = outerRadius - innerRadius;
  const halfAngle = sectorAngle * 0.48;

  // Base and apex points
  const pBase = polarToCartesian(innerRadius, 0);
  const pApex = polarToCartesian(outerRadius, 0);

  // Outer contour curves (symmetric left and right edges)
  const cpR = innerRadius + petalSpan * 0.55;
  const cpL1 = polarToCartesian(cpR, halfAngle);
  const cpL2 = polarToCartesian(innerRadius + petalSpan * 0.82, halfAngle * 0.7);

  const cpR1 = polarToCartesian(cpR, -halfAngle);
  const cpR2 = polarToCartesian(innerRadius + petalSpan * 0.82, -halfAngle * 0.7);

  // 1. Outer main contour
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
    width: 0.55,
    color: INK_COLOR,
    opacity: 0.95,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(outerPetalCmds),
  });

  // 2. Inner nested contour (archival engraving hallmark)
  const innerMargin = petalSpan * 0.12;
  const pInnerApex = polarToCartesian(outerRadius - innerMargin, 0);
  const innerHalfAngle = halfAngle * 0.75;
  const icpL1 = polarToCartesian(cpR, innerHalfAngle);
  const icpL2 = polarToCartesian(innerRadius + petalSpan * 0.78, innerHalfAngle * 0.65);
  const icpR1 = polarToCartesian(cpR, -innerHalfAngle);
  const icpR2 = polarToCartesian(innerRadius + petalSpan * 0.78, -innerHalfAngle * 0.65);

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
    width: 0.28,
    color: INK_COLOR,
    opacity: 0.75,
    ringIndex,
    revealOrder: 1,
    totalLength: approximatePathLength(innerContourCmds),
  });

  // 3. Central spine vein
  let spineCmds: PathCommand[] = [
    { type: 'M', x: pBase.x, y: pBase.y },
    { type: 'L', x: pInnerApex.x, y: pInnerApex.y },
  ];
  spineCmds = addOrganicImperfection(spineCmds, prng, wobble * 0.4);

  strokes.push({
    id: `lotus_spine_${ringIndex}`,
    commands: spineCmds,
    width: 0.32,
    color: INK_COLOR,
    opacity: 0.85,
    ringIndex,
    revealOrder: 2,
    totalLength: approximatePathLength(spineCmds),
  });

  // 4. Branching capillary veins
  const veinPairs = Math.max(2, Math.round(4 * detailDensity));
  for (let v = 1; v <= veinPairs; v++) {
    const t = v / (veinPairs + 1);
    const startR = innerRadius + petalSpan * t * 0.8;
    const pStart = polarToCartesian(startR, 0);

    const endR = innerRadius + petalSpan * (t * 0.8 + 0.18);
    const endAngle = innerHalfAngle * (0.85 - t * 0.3);

    // Left branch
    const pEndL = polarToCartesian(endR, endAngle);
    const cpL = polarToCartesian(
      startR + (endR - startR) * 0.5,
      endAngle * 0.3
    );
    let vCmdsL: PathCommand[] = [
      { type: 'M', x: pStart.x, y: pStart.y },
      { type: 'Q', cpx: cpL.x, cpy: cpL.y, x: pEndL.x, y: pEndL.y },
    ];
    vCmdsL = addOrganicImperfection(vCmdsL, prng, wobble * 0.5);

    // Right branch
    const pEndR = polarToCartesian(endR, -endAngle);
    const cpRBranch = polarToCartesian(
      startR + (endR - startR) * 0.5,
      -endAngle * 0.3
    );
    let vCmdsR: PathCommand[] = [
      { type: 'M', x: pStart.x, y: pStart.y },
      { type: 'Q', cpx: cpRBranch.x, cpy: cpRBranch.y, x: pEndR.x, y: pEndR.y },
    ];
    vCmdsR = addOrganicImperfection(vCmdsR, prng, wobble * 0.5);

    strokes.push({
      id: `lotus_vein_L_${ringIndex}_${v}`,
      commands: vCmdsL,
      width: 0.2,
      color: INK_COLOR,
      opacity: 0.65,
      ringIndex,
      revealOrder: 3 + v,
      totalLength: approximatePathLength(vCmdsL),
    });

    strokes.push({
      id: `lotus_vein_R_${ringIndex}_${v}`,
      commands: vCmdsR,
      width: 0.2,
      color: INK_COLOR,
      opacity: 0.65,
      ringIndex,
      revealOrder: 3 + v,
      totalLength: approximatePathLength(vCmdsR),
    });
  }

  // 5. Delicate stippled shadow at petal base
  const stipples: StippleDot[] = [];
  const stippleCount = Math.round(18 * detailDensity);
  for (let i = 0; i < stippleCount; i++) {
    // Clustered near base with exponential falloff
    const rFrac = Math.pow(prng.next(), 2.2);
    const r = innerRadius + petalSpan * 0.28 * rFrac;
    const ang = prng.jitter(halfAngle * 0.6 * (1 - rFrac));
    const pt = polarToCartesian(r, ang);
    stipples.push({
      x: pt.x,
      y: pt.y,
      r: prng.range(0.2, 0.45),
      opacity: prng.range(0.4, 0.85) * (1 - rFrac * 0.7),
      revealOrder: 4 + veinPairs,
    });
  }

  strokes.push({
    id: `lotus_stipple_${ringIndex}`,
    commands: [],
    width: 0.3,
    color: INK_COLOR,
    opacity: 0.9,
    ringIndex,
    revealOrder: 4 + veinPairs,
    totalLength: 1,
    stipples,
  });

  return strokes;
}

/**
 * 4. Generates a Fern / Botanical Leaf Frond with central curved rachis
 * and rhythmic alternating leaflets (pinnae).
 */
export function generateFernFrondMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng, detailDensity } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.3;
  const span = outerRadius - innerRadius;

  // Gently curved central stem
  const stemBase = polarToCartesian(innerRadius, -sectorAngle * 0.05);
  const stemTip = polarToCartesian(outerRadius, sectorAngle * 0.12);
  const cpStem1 = polarToCartesian(innerRadius + span * 0.4, sectorAngle * 0.08);
  const cpStem2 = polarToCartesian(innerRadius + span * 0.75, sectorAngle * 0.18);

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
  stemCmds = addOrganicImperfection(stemCmds, prng, wobble);

  strokes.push({
    id: `fern_stem_${ringIndex}`,
    commands: stemCmds,
    width: 0.45,
    color: INK_COLOR,
    opacity: 0.9,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(stemCmds),
  });

  // Alternating leaflets
  const leafletPairs = Math.max(3, Math.round(6 * detailDensity));
  for (let i = 1; i <= leafletPairs; i++) {
    const t = i / (leafletPairs + 1);
    const leafletLen = span * 0.22 * Math.sin(t * Math.PI) * (1 - t * 0.25);
    const stemPos = polarToCartesian(innerRadius + span * t, sectorAngle * 0.1 * t);

    // Left leaflet
    const leafAngleL = sectorAngle * 0.45;
    const tipL = polarToCartesian(
      innerRadius + span * t + leafletLen * 0.7,
      sectorAngle * 0.1 * t + leafAngleL
    );
    const cpL = polarToCartesian(
      innerRadius + span * t + leafletLen * 0.4,
      sectorAngle * 0.1 * t + leafAngleL * 1.2
    );

    let leafLCmds: PathCommand[] = [
      { type: 'M', x: stemPos.x, y: stemPos.y },
      { type: 'Q', cpx: cpL.x, cpy: cpL.y, x: tipL.x, y: tipL.y },
      {
        type: 'Q',
        cpx: cpL.x * 0.9 + stemPos.x * 0.1,
        cpy: cpL.y * 0.9 + stemPos.y * 0.1,
        x: stemPos.x,
        y: stemPos.y,
      },
    ];
    leafLCmds = addOrganicImperfection(leafLCmds, prng, wobble * 0.6);

    strokes.push({
      id: `fern_leaflet_L_${ringIndex}_${i}`,
      commands: leafLCmds,
      width: 0.28,
      color: INK_COLOR,
      opacity: 0.8,
      ringIndex,
      revealOrder: i,
      totalLength: approximatePathLength(leafLCmds),
    });

    // Right leaflet (offset slightly for natural organic alternate phyllotaxis)
    const tOffset = Math.min(0.95, t + 0.04);
    const stemPosR = polarToCartesian(
      innerRadius + span * tOffset,
      sectorAngle * 0.1 * tOffset
    );
    const leafAngleR = -sectorAngle * 0.42;
    const tipR = polarToCartesian(
      innerRadius + span * tOffset + leafletLen * 0.65,
      sectorAngle * 0.1 * tOffset + leafAngleR
    );
    const cpR = polarToCartesian(
      innerRadius + span * tOffset + leafletLen * 0.35,
      sectorAngle * 0.1 * tOffset + leafAngleR * 1.2
    );

    let leafRCmds: PathCommand[] = [
      { type: 'M', x: stemPosR.x, y: stemPosR.y },
      { type: 'Q', cpx: cpR.x, cpy: cpR.y, x: tipR.x, y: tipR.y },
      {
        type: 'Q',
        cpx: cpR.x * 0.9 + stemPosR.x * 0.1,
        cpy: cpR.y * 0.9 + stemPosR.y * 0.1,
        x: stemPosR.x,
        y: stemPosR.y,
      },
    ];
    leafRCmds = addOrganicImperfection(leafRCmds, prng, wobble * 0.6);

    strokes.push({
      id: `fern_leaflet_R_${ringIndex}_${i}`,
      commands: leafRCmds,
      width: 0.28,
      color: INK_COLOR,
      opacity: 0.8,
      ringIndex,
      revealOrder: i,
      totalLength: approximatePathLength(leafRCmds),
    });
  }

  return strokes;
}

/**
 * 5. Generates a Botanical Seed Pod with Pointillist Stippling.
 * Has an elongated urn/capsule profile and pointillist shading gradient.
 */
export function generateSeedPodMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng, detailDensity } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.3;
  const span = outerRadius - innerRadius;
  const podWidthAngle = sectorAngle * 0.32;

  // Stalk from inner ring
  const pStalk = polarToCartesian(innerRadius, 0);
  const pPodBase = polarToCartesian(innerRadius + span * 0.2, 0);

  let stalkCmds: PathCommand[] = [
    { type: 'M', x: pStalk.x, y: pStalk.y },
    { type: 'L', x: pPodBase.x, y: pPodBase.y },
  ];
  stalkCmds = addOrganicImperfection(stalkCmds, prng, wobble * 0.5);

  strokes.push({
    id: `pod_stalk_${ringIndex}`,
    commands: stalkCmds,
    width: 0.5,
    color: INK_COLOR,
    opacity: 0.9,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(stalkCmds),
  });

  // Ovoid pod contour
  const pPodCrown = polarToCartesian(innerRadius + span * 0.85, 0);
  const cpL1 = polarToCartesian(innerRadius + span * 0.45, podWidthAngle);
  const cpL2 = polarToCartesian(innerRadius + span * 0.72, podWidthAngle * 0.7);

  const cpR1 = polarToCartesian(innerRadius + span * 0.45, -podWidthAngle);
  const cpR2 = polarToCartesian(innerRadius + span * 0.72, -podWidthAngle * 0.7);

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
    width: 0.55,
    color: INK_COLOR,
    opacity: 0.95,
    ringIndex,
    revealOrder: 1,
    totalLength: approximatePathLength(podCmds),
  });

  // Crown serrations (star cap of the poppy pod)
  const crownTip = polarToCartesian(outerRadius, 0);
  const crownL = polarToCartesian(innerRadius + span * 0.92, podWidthAngle * 0.4);
  const crownR = polarToCartesian(innerRadius + span * 0.92, -podWidthAngle * 0.4);

  let crownCmds: PathCommand[] = [
    { type: 'M', x: crownL.x, y: crownL.y },
    { type: 'L', x: crownTip.x, y: crownTip.y },
    { type: 'L', x: crownR.x, y: crownR.y },
  ];
  crownCmds = addOrganicImperfection(crownCmds, prng, wobble * 0.5);

  strokes.push({
    id: `pod_crown_${ringIndex}`,
    commands: crownCmds,
    width: 0.4,
    color: INK_COLOR,
    opacity: 0.85,
    ringIndex,
    revealOrder: 2,
    totalLength: approximatePathLength(crownCmds),
  });

  // Dense pointillist stipples inside the pod body
  const stipples: StippleDot[] = [];
  const dotCount = Math.round(28 * detailDensity);
  for (let i = 0; i < dotCount; i++) {
    // Stipples distributed along curvature, denser at pod boundary
    const t = prng.range(0.25, 0.8);
    const r = innerRadius + span * t;
    const maxW = Math.sin((t - 0.2) / 0.6 * Math.PI) * podWidthAngle * 0.75;
    // Edge bias
    const u = prng.next();
    const sign = prng.boolean() ? 1 : -1;
    const ang = sign * Math.pow(u, 0.7) * maxW;

    const pt = polarToCartesian(r, ang);
    stipples.push({
      x: pt.x,
      y: pt.y,
      r: prng.range(0.22, 0.48),
      opacity: prng.range(0.45, 0.9),
      revealOrder: 3,
    });
  }

  strokes.push({
    id: `pod_stippling_${ringIndex}`,
    commands: [],
    width: 0.3,
    color: INK_COLOR,
    opacity: 1,
    ringIndex,
    revealOrder: 3,
    totalLength: 1,
    stipples,
  });

  return strokes;
}

/**
 * 6. Generates Curling Tendrils with logarithmic spiral tails and micro-buds.
 */
export function generateTendrilMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.3;
  const span = outerRadius - innerRadius;

  // Main arching tendril
  const pStart = polarToCartesian(innerRadius, -sectorAngle * 0.25);
  const pMid = polarToCartesian(innerRadius + span * 0.6, sectorAngle * 0.1);
  const pCurlCenter = polarToCartesian(innerRadius + span * 0.82, sectorAngle * 0.3);

  // Spiral curl at the tip
  const curlCmds: PathCommand[] = [{ type: 'M', x: pStart.x, y: pStart.y }];

  // Lead-up curve
  curlCmds.push({
    type: 'Q',
    cpx: pMid.x,
    cpy: pMid.y,
    x: pCurlCenter.x,
    y: pCurlCenter.y,
  });

  // 1.5 inward spiral turns
  const spiralSteps = 14;
  let rSp = span * 0.18;
  let currentAng = sectorAngle * 0.3;
  let prevPt = pCurlCenter;

  for (let s = 1; s <= spiralSteps; s++) {
    currentAng += 0.45;
    rSp *= 0.88;
    const nextPt = {
      x: pCurlCenter.x + rSp * Math.cos(currentAng),
      y: pCurlCenter.y + rSp * Math.sin(currentAng),
    };
    curlCmds.push({
      type: 'Q',
      cpx: (prevPt.x + nextPt.x) * 0.5 + prng.jitter(0.2),
      cpy: (prevPt.y + nextPt.y) * 0.5 + prng.jitter(0.2),
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
    opacity: 0.85,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(finalCmds),
  });

  // Tiny brass or ink bead at the spiral nucleus
  const stipples: StippleDot[] = [
    {
      x: prevPt.x,
      y: prevPt.y,
      r: 0.7,
      opacity: 0.9,
      revealOrder: 1,
    },
  ];

  strokes.push({
    id: `tendril_bead_${ringIndex}`,
    commands: [],
    width: 0.3,
    color: prng.boolean(0.4) ? BRASS_ACCENT : INK_COLOR,
    opacity: 0.9,
    ringIndex,
    revealOrder: 1,
    totalLength: 1,
    stipples,
  });

  return strokes;
}

/**
 * 7. Generates Paisley / Boteh / Acanthus motif with recurved teardrop apex.
 */
export function generatePaisleyMotif(cfg: MotifConfig): Stroke[] {
  const { ringIndex, innerRadius, outerRadius, sectorAngle, prng, detailDensity } = cfg;
  const strokes: Stroke[] = [];
  const wobble = cfg.wobble ?? 0.3;
  const span = outerRadius - innerRadius;

  const pBase = polarToCartesian(innerRadius, 0);
  const pBelly = polarToCartesian(innerRadius + span * 0.5, sectorAngle * 0.35);
  const pWaist = polarToCartesian(innerRadius + span * 0.75, sectorAngle * 0.1);
  const pApexCurl = polarToCartesian(outerRadius, -sectorAngle * 0.15);

  let paisleyCmds: PathCommand[] = [
    { type: 'M', x: pBase.x, y: pBase.y },
    {
      type: 'C',
      cp1x: pBelly.x + prng.jitter(0.5),
      cp1y: pBelly.y + prng.jitter(0.5),
      cp2x: pWaist.x,
      cp2y: pWaist.y,
      x: pApexCurl.x,
      y: pApexCurl.y,
    },
    {
      type: 'C',
      cp1x: pApexCurl.x - span * 0.1,
      cp1y: pApexCurl.y,
      cp2x: polarToCartesian(innerRadius + span * 0.4, -sectorAngle * 0.2).x,
      cp2y: polarToCartesian(innerRadius + span * 0.4, -sectorAngle * 0.2).y,
      x: pBase.x,
      y: pBase.y,
    },
  ];
  paisleyCmds = addOrganicImperfection(paisleyCmds, prng, wobble);

  strokes.push({
    id: `paisley_outer_${ringIndex}`,
    commands: paisleyCmds,
    width: 0.5,
    color: INK_COLOR,
    opacity: 0.95,
    ringIndex,
    revealOrder: 0,
    totalLength: approximatePathLength(paisleyCmds),
  });

  // Internal hatching ribs
  const ribCount = Math.max(3, Math.round(5 * detailDensity));
  for (let r = 1; r <= ribCount; r++) {
    const t = r / (ribCount + 1);
    const rL = innerRadius + span * t * 0.7;
    const p1 = polarToCartesian(rL, sectorAngle * 0.25 * Math.sin(t * Math.PI));
    const p2 = polarToCartesian(rL * 0.95, -sectorAngle * 0.12 * Math.sin(t * Math.PI));

    let ribCmds: PathCommand[] = [
      { type: 'M', x: p1.x, y: p1.y },
      { type: 'L', x: p2.x, y: p2.y },
    ];
    ribCmds = addOrganicImperfection(ribCmds, prng, wobble * 0.5);

    strokes.push({
      id: `paisley_rib_${ringIndex}_${r}`,
      commands: ribCmds,
      width: 0.22,
      color: INK_COLOR,
      opacity: 0.7,
      ringIndex,
      revealOrder: r,
      totalLength: approximatePathLength(ribCmds),
    });
  }

  return strokes;
}

/**
 * 8. Generates Scalloped / Beaded Ring Divider between concentric tiers.
 */
export function generateRingDivider(
  radius: number,
  sectorAngle: number,
  ringIndex: number,
  prng: PRNG,
  style: 'beads' | 'scallops' | 'chevrons' = 'beads'
): Stroke[] {
  const strokes: Stroke[] = [];
  const wobble = 0.2;

  if (style === 'beads') {
    // String of pearl beads across the sector arc
    const beadsPerSector = 5;
    const stipples: StippleDot[] = [];
    for (let b = 0; b < beadsPerSector; b++) {
      const ang = (b / beadsPerSector) * sectorAngle;
      const pt = polarToCartesian(radius, ang);
      stipples.push({
        x: pt.x,
        y: pt.y,
        r: prng.range(0.5, 0.75),
        opacity: prng.range(0.8, 0.95),
        revealOrder: b,
      });
    }

    strokes.push({
      id: `divider_beads_${ringIndex}`,
      commands: [],
      width: 0.3,
      color: prng.boolean(0.25) ? BRASS_ACCENT : INK_COLOR,
      opacity: 0.9,
      ringIndex,
      revealOrder: 0,
      totalLength: 1,
      stipples,
    });
  } else if (style === 'scallops') {
    // Arching scalloped bridge
    const pStart = polarToCartesian(radius, 0);
    const pEnd = polarToCartesian(radius, sectorAngle);
    const pPeak = polarToCartesian(radius + 3.5, sectorAngle * 0.5);

    let scCmds: PathCommand[] = [
      { type: 'M', x: pStart.x, y: pStart.y },
      { type: 'Q', cpx: pPeak.x, cpy: pPeak.y, x: pEnd.x, y: pEnd.y },
    ];
    scCmds = addOrganicImperfection(scCmds, prng, wobble);

    strokes.push({
      id: `divider_scallop_${ringIndex}`,
      commands: scCmds,
      width: 0.35,
      color: INK_COLOR,
      opacity: 0.85,
      ringIndex,
      revealOrder: 0,
      totalLength: approximatePathLength(scCmds),
    });
  } else {
    // Chevrons / zig-zag teeth
    const pStart = polarToCartesian(radius, 0);
    const pMid = polarToCartesian(radius + 2.5, sectorAngle * 0.5);
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
      opacity: 0.8,
      ringIndex,
      revealOrder: 0,
      totalLength: approximatePathLength(chCmds),
    });
  }

  return strokes;
}
