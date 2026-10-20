/**
 * Vector SVG Serializer and Exporter for The Living Manuscript.
 * Produces clean, standards-compliant, infinitely scalable SVG files.
 */

import type { MandalaScene } from '../engine/scene';
import type { PathCommand } from '../engine/geometry';
import { VELLUM_COLOR, INK_COLOR, GRAPHITE_COLOR } from '../engine/renderer';

export interface SVGExportOptions {
  includeBackground?: boolean;
  includeGuides?: boolean;
  size?: number; // output square viewBox dimension (default 1000)
}

/**
 * Converts a sequence of PathCommands into an SVG path 'd' attribute string.
 */
export function commandsToSVGPath(commands: PathCommand[]): string {
  const parts: string[] = [];
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        parts.push(`M ${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)}`);
        break;
      case 'L':
        parts.push(`L ${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)}`);
        break;
      case 'C':
        parts.push(
          `C ${cmd.cp1x.toFixed(2)} ${cmd.cp1y.toFixed(2)}, ${cmd.cp2x.toFixed(2)} ${cmd.cp2y.toFixed(2)}, ${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)}`
        );
        break;
      case 'Q':
        parts.push(`Q ${cmd.cpx.toFixed(2)} ${cmd.cpy.toFixed(2)}, ${cmd.x.toFixed(2)} ${cmd.y.toFixed(2)}`);
        break;
      case 'Z':
        parts.push('Z');
        break;
    }
  }
  return parts.join(' ');
}

/**
 * Generates an SVG string representation of the MandalaScene.
 */
export function generateSVGString(scene: MandalaScene, options: SVGExportOptions = {}): string {
  const { includeBackground = true, includeGuides = false, size = 1200 } = options;
  const padding = 60;
  const extent = scene.maxRadius * 1.15;
  const viewBoxMin = -extent - padding;
  const viewBoxDim = (extent + padding) * 2;

  const lines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxMin.toFixed(2)} ${viewBoxMin.toFixed(2)} ${viewBoxDim.toFixed(2)} ${viewBoxDim.toFixed(2)}" width="${size}" height="${size}">`,
    `  <title>The Living Manuscript · Specimen ${scene.seed}</title>`,
    `  <desc>Botanical mandala generated algorithmically with ${scene.sectors}-fold radial symmetry.</desc>`,
  ];

  if (includeBackground) {
    lines.push(
      `  <rect x="${viewBoxMin.toFixed(2)}" y="${viewBoxMin.toFixed(2)}" width="${viewBoxDim.toFixed(2)}" height="${viewBoxDim.toFixed(2)}" fill="${VELLUM_COLOR}" />`
    );
  }

  // Construction guides (optional)
  if (includeGuides) {
    lines.push(`  <g id="construction-guides" stroke="${GRAPHITE_COLOR}" stroke-width="0.3" opacity="0.25" fill="none">`);
    for (const guide of scene.guideStrokes) {
      const d = commandsToSVGPath(guide.commands);
      if (d) {
        lines.push(`    <path d="${d}" />`);
      }
    }
    lines.push(`  </g>`);
  }

  // Ink Strokes
  lines.push(`  <g id="ink-strokes" stroke-linecap="round" stroke-linejoin="round" fill="none">`);
  for (const stroke of scene.inkStrokes) {
    const strokeColor = stroke.color || INK_COLOR;
    const strokeWidth = stroke.width;
    const opacity = stroke.opacity ?? 1.0;

    if (stroke.commands.length > 0) {
      const d = commandsToSVGPath(stroke.commands);
      if (d) {
        lines.push(
          `    <path d="${d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity.toFixed(2)}" />`
        );
      }
    }

    // Stipple dots
    if (stroke.stipples && stroke.stipples.length > 0) {
      lines.push(`    <g id="${stroke.id}_dots" fill="${strokeColor}">`);
      for (const dot of stroke.stipples) {
        lines.push(
          `      <circle cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${dot.r.toFixed(2)}" opacity="${dot.opacity.toFixed(2)}" />`
        );
      }
      lines.push(`    </g>`);
    }
  }
  lines.push(`  </g>`);

  lines.push(`</svg>`);
  return lines.join('\n');
}

/**
 * Triggers a browser file download of the SVG artwork.
 */
export function downloadSVG(scene: MandalaScene, options: SVGExportOptions = {}): void {
  const svgContent = generateSVGString(scene, options);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `living-manuscript-${scene.seed}.svg`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
