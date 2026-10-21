/**
 * High-DPI Canvas 2D Renderer for The Living Manuscript.
 * Handles handmade vellum texture, archival ink line rendering,
 * progressive stroke reveal ("The Invisible Scribe"), guide fading,
 * and nested scene compositing.
 */

import type { MandalaScene } from './scene';
import { Camera } from './camera';
import { slicePathByProgress, type Stroke, type PathCommand } from './geometry';

export const VELLUM_COLOR = '#F3EBDD';
export const INK_COLOR = '#26251F';
export const GRAPHITE_COLOR = '#9B907C';
export const BRASS_COLOR = '#A28A58';

export interface RenderOptions {
  showGuides?: boolean;
  fadeGuidesWithProgress?: boolean;
  paperGrain?: boolean;
  activeProgress?: number; // 0 (blank) to 1 (complete)
  accentHighlights?: boolean;
}

export class ManuscriptRenderer {
  private noiseCanvas: HTMLCanvasElement | null = null;
  private noisePattern: CanvasPattern | null = null;

  constructor() {
    this.createPaperTexture();
  }

  /**
   * Generates a subtle procedural paper fiber and tooth texture.
   */
  private createPaperTexture(): void {
    if (typeof document === 'undefined') return;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill base vellum tone
    ctx.fillStyle = VELLUM_COLOR;
    ctx.fillRect(0, 0, size, size);

    // Add delicate grain and fiber speckles
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Subtle organic noise variation
      const grain = (Math.random() - 0.5) * 12;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 0.95));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 0.85));
      // Random delicate vellum fibers
      if (Math.random() < 0.001) {
        data[i] -= 25;
        data[i + 1] -= 22;
        data[i + 2] -= 18;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.noiseCanvas = canvas;
  }

  /**
   * Main render loop executing high-DPI Canvas 2D drawing.
   */
  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: MandalaScene,
    camera: Camera,
    progress = 1.0,
    options: RenderOptions = {},
    childScene?: MandalaScene | null
  ): void {
    const {
      showGuides = true,
      fadeGuidesWithProgress = true,
      paperGrain = true,
    } = options;

    // Save initial state
    ctx.save();

    // 1. Fill background with warm vellum
    ctx.fillStyle = VELLUM_COLOR;
    ctx.fillRect(0, 0, width, height);

    // 2. Paper grain overlay
    if (paperGrain && this.noiseCanvas) {
      if (!this.noisePattern) {
        this.noisePattern = ctx.createPattern(this.noiseCanvas, 'repeat');
      }
      if (this.noisePattern) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = this.noisePattern;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }

    // 3. Apply Camera viewport transform (pan & zoom centered on screen)
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.state.zoom, camera.state.zoom);
    ctx.translate(-camera.state.x, -camera.state.y);

    // Setup high-precision line join/cap for archival ink feel
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 4. Render Construction Guides (Compass circles & rays)
    if (showGuides) {
      // If progressive drawing is active, fade guides out as ink cures
      let guideAlpha = 0.35;
      if (fadeGuidesWithProgress) {
        if (progress < 0.15) {
          guideAlpha = (progress / 0.15) * 0.35;
        } else if (progress > 0.55) {
          const fadeT = (progress - 0.55) / 0.45;
          guideAlpha = Math.max(0.04, 0.35 * (1 - fadeT * 0.88));
        }
      }

      ctx.save();
      ctx.strokeStyle = GRAPHITE_COLOR;
      ctx.globalAlpha = guideAlpha;
      ctx.lineWidth = 0.35 / Math.sqrt(camera.state.zoom);

      for (const guide of scene.guideStrokes) {
        this.drawPathCommands(ctx, guide.commands);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Render Ink Strokes with Progressive Timeline
    // Guide phase takes 0 -> 0.10, Ink phase takes 0.10 -> 1.00
    const inkProgress = Math.max(0, Math.min(1, (progress - 0.08) / 0.92));
    const totalStrokes = scene.inkStrokes.length;
    const activeStrokeIndex = Math.floor(inkProgress * totalStrokes);
    const fractionalStrokeProgress = (inkProgress * totalStrokes) - activeStrokeIndex;

    const zoomScale = Math.sqrt(camera.state.zoom);

    for (let i = 0; i < totalStrokes; i++) {
      if (i > activeStrokeIndex) break;

      const stroke = scene.inkStrokes[i];
      const isCurrentlyDrawing = i === activeStrokeIndex;
      const strokeProgress = isCurrentlyDrawing ? fractionalStrokeProgress : 1.0;

      this.renderSingleStroke(ctx, stroke, strokeProgress, zoomScale);
    }

    // 6. Render Nested Sub-Scene for The Infinite Passage
    // Smoothly cross-fades child scene inside medallion core as zoom increases
    if (childScene && camera.state.zoom > 2.0) {
      // Child alpha ramps gently from 0 at zoom=2.0 to 1.0 at zoom=5.5
      const childAlpha = Math.min(1.0, Math.max(0, (camera.state.zoom - 2.0) / 3.5));
      ctx.save();
      ctx.globalAlpha = childAlpha;

      // The child scene is geometrically nested inside the parent medallion aperture
      const childScale = scene.radii[0] / childScene.maxRadius;
      ctx.scale(childScale, childScale);

      // Render child ink strokes
      for (const stroke of childScene.inkStrokes) {
        this.renderSingleStroke(ctx, stroke, 1.0, zoomScale * Math.sqrt(childScale));
      }

      ctx.restore();
    }

    ctx.restore(); // Restore camera transform
    ctx.restore(); // Restore canvas
  }

  /**
   * Draws a single stroke (or its stipples) with progressive progress.
   */
  private renderSingleStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    strokeProgress: number,
    zoomScale: number
  ): void {
    // A. Render Path commands (lines / bezier contours)
    if (stroke.commands.length > 0) {
      const cmdsToDraw =
        strokeProgress >= 1.0
          ? stroke.commands
          : slicePathByProgress(stroke.commands, strokeProgress, stroke.totalLength);

      if (cmdsToDraw.length > 0) {
        ctx.save();
        ctx.strokeStyle = stroke.color || INK_COLOR;
        ctx.globalAlpha = (stroke.opacity ?? 1.0) * (strokeProgress < 0.3 ? strokeProgress / 0.3 : 1.0);
        // Adaptive line width maintains micron pen definition across scales
        ctx.lineWidth = Math.max(0.18, stroke.width / Math.pow(zoomScale, 0.45));

        this.drawPathCommands(ctx, cmdsToDraw);
        ctx.stroke();
        ctx.restore();
      }
    }

    // B. Render Stipple Dots (pointillist shading and beads)
    if (stroke.stipples && stroke.stipples.length > 0) {
      const dotCount = Math.floor(strokeProgress * stroke.stipples.length);
      ctx.save();
      ctx.fillStyle = stroke.color || INK_COLOR;

      for (let s = 0; s < dotCount; s++) {
        const dot = stroke.stipples[s];
        ctx.globalAlpha = dot.opacity;
        ctx.beginPath();
        const r = Math.max(0.2, dot.r / Math.pow(zoomScale, 0.45));
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Emits Canvas 2D path instructions from PathCommand array.
   */
  private drawPathCommands(ctx: CanvasRenderingContext2D, commands: PathCommand[]): void {
    ctx.beginPath();
    for (const cmd of commands) {
      switch (cmd.type) {
        case 'M':
          ctx.moveTo(cmd.x, cmd.y);
          break;
        case 'L':
          ctx.lineTo(cmd.x, cmd.y);
          break;
        case 'C':
          ctx.bezierCurveTo(cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y);
          break;
        case 'Q':
          ctx.quadraticCurveTo(cmd.cpx, cmd.cpy, cmd.x, cmd.y);
          break;
        case 'Z':
          ctx.closePath();
          break;
      }
    }
  }
}
