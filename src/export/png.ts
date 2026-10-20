/**
 * High-Resolution Raster PNG Exporter for The Living Manuscript.
 * Renders the composition to an offscreen high-DPI canvas (e.g. 2400x2400)
 * with authentic vellum grain and archival ink linework.
 */

import type { MandalaScene } from '../engine/scene';
import { Camera } from '../engine/camera';
import { ManuscriptRenderer } from '../engine/renderer';

export interface PNGExportOptions {
  size?: number; // Canvas pixel width and height (e.g. 2400 for high-res print)
  includeGuides?: boolean;
}

/**
 * Generates and downloads a high-resolution PNG of the mandala composition.
 */
export async function downloadHighResPNG(
  scene: MandalaScene,
  options: PNGExportOptions = {}
): Promise<void> {
  const size = options.size ?? 2400;
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = size;
  offscreenCanvas.height = size;

  const ctx = offscreenCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire 2D rendering context for PNG export');

  const renderer = new ManuscriptRenderer();
  const exportCamera = new Camera();

  // Adjust zoom so full mandala occupies ~80% of the canvas
  const paddingRatio = 0.82;
  const scale = (size * paddingRatio * 0.5) / scene.maxRadius;
  exportCamera.state.zoom = scale;
  exportCamera.state.targetZoom = scale;
  exportCamera.state.x = 0;
  exportCamera.state.y = 0;

  // Render fully revealed artwork
  renderer.render(
    ctx,
    size,
    size,
    scene,
    exportCamera,
    1.0, // progress 1.0
    {
      showGuides: options.includeGuides ?? false,
      fadeGuidesWithProgress: true,
      paperGrain: true,
    }
  );

  return new Promise((resolve, reject) => {
    offscreenCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `living-manuscript-${scene.seed}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        resolve();
      },
      'image/png',
      1.0
    );
  });
}
