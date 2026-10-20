/**
 * Core geometric types and mathematical utilities for The Living Manuscript.
 * Handles polar coordinates, Bézier curves, path transformations, arc-length
 * parameterization, and organic hand-drawn line perturbations.
 */

import type { PRNG } from './random';

export interface Point {
  x: number;
  y: number;
}

export interface PolarPoint {
  r: number;
  theta: number; // in radians
}

export type PathCommand =
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'C'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number }
  | { type: 'Q'; cpx: number; cpy: number; x: number; y: number }
  | { type: 'Z' };

export interface StippleDot {
  x: number;
  y: number;
  r: number;
  opacity: number;
  revealOrder: number;
}

export interface Stroke {
  id: string;
  commands: PathCommand[];
  width: number;
  color?: string;
  opacity?: number;
  isGuide?: boolean;
  ringIndex: number;
  sectorIndex?: number;
  revealOrder: number;
  totalLength: number;
  stipples?: StippleDot[];
}

/**
 * Converts polar coordinates to Cartesian coordinates with an optional center offset.
 */
export function polarToCartesian(
  r: number,
  theta: number,
  center: Point = { x: 0, y: 0 }
): Point {
  return {
    x: center.x + r * Math.cos(theta),
    y: center.y + r * Math.sin(theta),
  };
}

/**
 * Converts Cartesian coordinates to polar coordinates relative to a center.
 */
export function cartesianToPolar(
  p: Point,
  center: Point = { x: 0, y: 0 }
): PolarPoint {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    r: Math.hypot(dx, dy),
    theta: Math.atan2(dy, dx),
  };
}

/**
 * Rotates a 2D point around a center by an angle in radians.
 */
export function rotatePoint(p: Point, angle: number, center: Point = { x: 0, y: 0 }): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  };
}

/**
 * Reflects a point across a radial ray extending from center at a specified angle.
 */
export function reflectPointAcrossRay(
  p: Point,
  rayAngle: number,
  center: Point = { x: 0, y: 0 }
): Point {
  // Translate to origin
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  // Rotate by -rayAngle to align ray with X axis
  const cos = Math.cos(-rayAngle);
  const sin = Math.sin(-rayAngle);
  const rx = dx * cos - dy * sin;
  const ry = -(dx * sin + dy * cos); // reflect across X axis
  // Rotate back by +rayAngle
  const cosBack = Math.cos(rayAngle);
  const sinBack = Math.sin(rayAngle);
  return {
    x: center.x + (rx * cosBack - ry * sinBack),
    y: center.y + (rx * sinBack + ry * cosBack),
  };
}

/**
 * Rotates an array of path commands around a center by an angle in radians.
 */
export function rotateCommands(
  commands: PathCommand[],
  angle: number,
  center: Point = { x: 0, y: 0 }
): PathCommand[] {
  if (Math.abs(angle) < 1e-9) return commands;
  return commands.map((cmd) => {
    switch (cmd.type) {
      case 'M': {
        const pt = rotatePoint({ x: cmd.x, y: cmd.y }, angle, center);
        return { type: 'M', x: pt.x, y: pt.y };
      }
      case 'L': {
        const pt = rotatePoint({ x: cmd.x, y: cmd.y }, angle, center);
        return { type: 'L', x: pt.x, y: pt.y };
      }
      case 'C': {
        const cp1 = rotatePoint({ x: cmd.cp1x, y: cmd.cp1y }, angle, center);
        const cp2 = rotatePoint({ x: cmd.cp2x, y: cmd.cp2y }, angle, center);
        const pt = rotatePoint({ x: cmd.x, y: cmd.y }, angle, center);
        return {
          type: 'C',
          cp1x: cp1.x,
          cp1y: cp1.y,
          cp2x: cp2.x,
          cp2y: cp2.y,
          x: pt.x,
          y: pt.y,
        };
      }
      case 'Q': {
        const cp = rotatePoint({ x: cmd.cpx, y: cmd.cpy }, angle, center);
        const pt = rotatePoint({ x: cmd.x, y: cmd.y }, angle, center);
        return {
          type: 'Q',
          cpx: cp.x,
          cpy: cp.y,
          x: pt.x,
          y: pt.y,
        };
      }
      case 'Z':
        return { type: 'Z' };
    }
  });
}

/**
 * Reflects path commands across a radial axis angle.
 */
export function reflectCommands(
  commands: PathCommand[],
  axisAngle: number,
  center: Point = { x: 0, y: 0 }
): PathCommand[] {
  return commands.map((cmd) => {
    switch (cmd.type) {
      case 'M': {
        const pt = reflectPointAcrossRay({ x: cmd.x, y: cmd.y }, axisAngle, center);
        return { type: 'M', x: pt.x, y: pt.y };
      }
      case 'L': {
        const pt = reflectPointAcrossRay({ x: cmd.x, y: cmd.y }, axisAngle, center);
        return { type: 'L', x: pt.x, y: pt.y };
      }
      case 'C': {
        const cp1 = reflectPointAcrossRay({ x: cmd.cp1x, y: cmd.cp1y }, axisAngle, center);
        const cp2 = reflectPointAcrossRay({ x: cmd.cp2x, y: cmd.cp2y }, axisAngle, center);
        const pt = reflectPointAcrossRay({ x: cmd.x, y: cmd.y }, axisAngle, center);
        return {
          type: 'C',
          cp1x: cp1.x,
          cp1y: cp1.y,
          cp2x: cp2.x,
          cp2y: cp2.y,
          x: pt.x,
          y: pt.y,
        };
      }
      case 'Q': {
        const cp = reflectPointAcrossRay({ x: cmd.cpx, y: cmd.cpy }, axisAngle, center);
        const pt = reflectPointAcrossRay({ x: cmd.x, y: cmd.y }, axisAngle, center);
        return {
          type: 'Q',
          cpx: cp.x,
          cpy: cp.y,
          x: pt.x,
          y: pt.y,
        };
      }
      case 'Z':
        return { type: 'Z' };
    }
  });
}

/**
 * Calculates a point on a cubic Bézier curve at parameter t in [0, 1].
 */
export function evalCubicBezier(
  p0: Point,
  cp1: Point,
  cp2: Point,
  p1: Point,
  t: number
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p1.x,
    y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p1.y,
  };
}

/**
 * Subdivides a cubic Bézier curve from t = 0 to t = splitT using de Casteljau's algorithm.
 */
export function sliceCubicBezier(
  p0: Point,
  cp1: Point,
  cp2: Point,
  p1: Point,
  splitT: number
): { cp1: Point; cp2: Point; end: Point } {
  const t = Math.max(0, Math.min(1, splitT));
  const p01 = { x: p0.x + (cp1.x - p0.x) * t, y: p0.y + (cp1.y - p0.y) * t };
  const p12 = { x: cp1.x + (cp2.x - cp1.x) * t, y: cp1.y + (cp2.y - cp1.y) * t };
  const p23 = { x: cp2.x + (p1.x - cp2.x) * t, y: cp2.y + (p1.y - cp2.y) * t };

  const p012 = { x: p01.x + (p12.x - p01.x) * t, y: p01.y + (p12.y - p01.y) * t };
  const p123 = { x: p12.x + (p23.x - p12.x) * t, y: p12.y + (p23.y - p12.y) * t };

  const p0123 = { x: p012.x + (p123.x - p012.x) * t, y: p012.y + (p123.y - p012.y) * t };

  return {
    cp1: p01,
    cp2: p012,
    end: p0123,
  };
}

/**
 * Approximates the arc length of a path command array.
 */
export function approximatePathLength(commands: PathCommand[]): number {
  let length = 0;
  let currentPos: Point = { x: 0, y: 0 };
  let startPos: Point = { x: 0, y: 0 };

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        currentPos = { x: cmd.x, y: cmd.y };
        startPos = { ...currentPos };
        break;
      case 'L': {
        const d = Math.hypot(cmd.x - currentPos.x, cmd.y - currentPos.y);
        length += d;
        currentPos = { x: cmd.x, y: cmd.y };
        break;
      }
      case 'C': {
        // Approximate cubic Bézier with 10 linear segments
        const p0 = currentPos;
        const cp1 = { x: cmd.cp1x, y: cmd.cp1y };
        const cp2 = { x: cmd.cp2x, y: cmd.cp2y };
        const p1 = { x: cmd.x, y: cmd.y };
        let prev = p0;
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
          const pt = evalCubicBezier(p0, cp1, cp2, p1, i / steps);
          length += Math.hypot(pt.x - prev.x, pt.y - prev.y);
          prev = pt;
        }
        currentPos = p1;
        break;
      }
      case 'Q': {
        // Quadratic approximated
        const p0 = currentPos;
        const p1 = { x: cmd.x, y: cmd.y };
        const cp = { x: cmd.cpx, y: cmd.cpy };
        let prev = p0;
        const steps = 8;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const mt = 1 - t;
          const pt = {
            x: mt * mt * p0.x + 2 * mt * t * cp.x + t * t * p1.x,
            y: mt * mt * p0.y + 2 * mt * t * cp.y + t * t * p1.y,
          };
          length += Math.hypot(pt.x - prev.x, pt.y - prev.y);
          prev = pt;
        }
        currentPos = p1;
        break;
      }
      case 'Z': {
        length += Math.hypot(startPos.x - currentPos.x, startPos.y - currentPos.y);
        currentPos = { ...startPos };
        break;
      }
    }
  }

  return Math.max(length, 1);
}

/**
 * Truncates path commands to a progress fraction in [0, 1] for progressive stroke drawing.
 */
export function slicePathByProgress(
  commands: PathCommand[],
  progress: number,
  totalLength: number
): PathCommand[] {
  if (progress <= 0) return [];
  if (progress >= 1) return commands;

  const targetLength = progress * totalLength;
  const result: PathCommand[] = [];
  let accumulated = 0;
  let currentPos: Point = { x: 0, y: 0 };
  let startPos: Point = { x: 0, y: 0 };

  for (const cmd of commands) {
    if (accumulated >= targetLength) break;

    switch (cmd.type) {
      case 'M':
        currentPos = { x: cmd.x, y: cmd.y };
        startPos = { ...currentPos };
        result.push(cmd);
        break;
      case 'L': {
        const segLen = Math.hypot(cmd.x - currentPos.x, cmd.y - currentPos.y);
        if (accumulated + segLen <= targetLength) {
          result.push(cmd);
          accumulated += segLen;
          currentPos = { x: cmd.x, y: cmd.y };
        } else {
          // Truncate linear segment
          const remain = targetLength - accumulated;
          const t = segLen > 0 ? remain / segLen : 0;
          const endPt = {
            x: currentPos.x + (cmd.x - currentPos.x) * t,
            y: currentPos.y + (cmd.y - currentPos.y) * t,
          };
          result.push({ type: 'L', x: endPt.x, y: endPt.y });
          accumulated = targetLength;
        }
        break;
      }
      case 'C': {
        // Approximate segment length
        const p0 = currentPos;
        const cp1 = { x: cmd.cp1x, y: cmd.cp1y };
        const cp2 = { x: cmd.cp2x, y: cmd.cp2y };
        const p1 = { x: cmd.x, y: cmd.y };
        let prev = p0;
        let segLen = 0;
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
          const pt = evalCubicBezier(p0, cp1, cp2, p1, i / steps);
          segLen += Math.hypot(pt.x - prev.x, pt.y - prev.y);
          prev = pt;
        }

        if (accumulated + segLen <= targetLength) {
          result.push(cmd);
          accumulated += segLen;
          currentPos = p1;
        } else {
          // Truncate cubic Bézier
          const remain = targetLength - accumulated;
          const splitT = segLen > 0 ? Math.max(0, Math.min(1, remain / segLen)) : 0;
          const sliced = sliceCubicBezier(p0, cp1, cp2, p1, splitT);
          result.push({
            type: 'C',
            cp1x: sliced.cp1.x,
            cp1y: sliced.cp1.y,
            cp2x: sliced.cp2.x,
            cp2y: sliced.cp2.y,
            x: sliced.end.x,
            y: sliced.end.y,
          });
          accumulated = targetLength;
        }
        break;
      }
      case 'Q': {
        // Convert Q to L approximation if truncated
        result.push(cmd);
        break;
      }
      case 'Z': {
        const segLen = Math.hypot(startPos.x - currentPos.x, startPos.y - currentPos.y);
        if (accumulated + segLen <= targetLength) {
          result.push(cmd);
          accumulated += segLen;
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Adds subtle hand-drawn organic variation to simulate physical micron pen on vellum.
 */
export function addOrganicImperfection(
  commands: PathCommand[],
  prng: PRNG,
  wobblePx = 0.35
): PathCommand[] {
  return commands.map((cmd) => {
    switch (cmd.type) {
      case 'M':
        return {
          type: 'M',
          x: cmd.x + prng.jitter(wobblePx * 0.4),
          y: cmd.y + prng.jitter(wobblePx * 0.4),
        };
      case 'L':
        return {
          type: 'L',
          x: cmd.x + prng.jitter(wobblePx),
          y: cmd.y + prng.jitter(wobblePx),
        };
      case 'C':
        return {
          type: 'C',
          cp1x: cmd.cp1x + prng.jitter(wobblePx * 0.8),
          cp1y: cmd.cp1y + prng.jitter(wobblePx * 0.8),
          cp2x: cmd.cp2x + prng.jitter(wobblePx * 0.8),
          cp2y: cmd.cp2y + prng.jitter(wobblePx * 0.8),
          x: cmd.x + prng.jitter(wobblePx),
          y: cmd.y + prng.jitter(wobblePx),
        };
      case 'Q':
        return {
          type: 'Q',
          cpx: cmd.cpx + prng.jitter(wobblePx * 0.8),
          cpy: cmd.cpy + prng.jitter(wobblePx * 0.8),
          x: cmd.x + prng.jitter(wobblePx),
          y: cmd.y + prng.jitter(wobblePx),
        };
      case 'Z':
        return { type: 'Z' };
    }
  });
}
