/**
 * Camera system with smooth spring damping, pan, zoom,
 * and continuous auto-exploration for The Infinite Passage.
 */

import type { Point } from './geometry';
import { SEAMLESS_ZOOM_RATIO } from './scene';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  isExploring: boolean;
  exploreSpeed: number; // zoom factor change per second
  depthOffset: number; // accumulated infinite zoom depth count
}

export const INITIAL_CAMERA_STATE: CameraState = {
  x: 0,
  y: 0,
  zoom: 1.0,
  targetX: 0,
  targetY: 0,
  targetZoom: 1.0,
  isExploring: false,
  exploreSpeed: 0.16, // gentle meditative inward glide
  depthOffset: 0,
};

export const MIN_ZOOM = 0.45;
export const MAX_ZOOM_THRESHOLD = SEAMLESS_ZOOM_RATIO; // Seamless mathematical transition threshold

export class Camera {
  state: CameraState;

  constructor(initialState?: Partial<CameraState>) {
    this.state = {
      ...INITIAL_CAMERA_STATE,
      ...initialState,
    };
  }

  /**
   * Resets camera to origin at 1.0x scale.
   */
  reset(): void {
    this.state.x = 0;
    this.state.y = 0;
    this.state.targetX = 0;
    this.state.targetY = 0;
    this.state.zoom = 1.0;
    this.state.targetZoom = 1.0;
    this.state.isExploring = false;
  }

  /**
   * Toggles auto-explore continuous zoom.
   */
  toggleExplore(): boolean {
    this.state.isExploring = !this.state.isExploring;
    if (this.state.isExploring) {
      // Gently center target
      this.state.targetX = 0;
      this.state.targetY = 0;
    }
    return this.state.isExploring;
  }

  setExploring(exploring: boolean): void {
    this.state.isExploring = exploring;
    if (exploring) {
      this.state.targetX = 0;
      this.state.targetY = 0;
    }
  }

  /**
   * Zooms toward an anchor point (e.g. mouse position in screen coordinates).
   */
  zoomAt(factor: number, anchorScreenX: number, anchorScreenY: number, viewportWidth: number, viewportHeight: number): void {
    const oldZoom = this.state.targetZoom;
    const newZoom = Math.max(MIN_ZOOM, Math.min(20.0, oldZoom * factor));

    // Shift target so the point under cursor remains fixed
    const centerScreenX = viewportWidth / 2;
    const centerScreenY = viewportHeight / 2;

    const dx = anchorScreenX - centerScreenX;
    const dy = anchorScreenY - centerScreenY;

    this.state.targetX -= (dx / oldZoom) - (dx / newZoom);
    this.state.targetY -= (dy / oldZoom) - (dy / newZoom);
    this.state.targetZoom = newZoom;
  }

  /**
   * Pans the camera target by screen delta.
   */
  pan(screenDeltaX: number, screenDeltaY: number): void {
    this.state.targetX -= screenDeltaX / this.state.zoom;
    this.state.targetY -= screenDeltaY / this.state.zoom;
    if (this.state.isExploring) {
      // Interacting pauses explore mode so user has full control
      this.state.isExploring = false;
    }
  }

  /**
   * Per-frame physics update using spring easing.
   * Returns whether a depth transition threshold was crossed.
   */
  update(dtMs: number): { crossedDepthThreshold: boolean; newDepth: number } {
    const dt = Math.min(dtMs / 1000, 0.1);

    // Continuous auto-explore inward zoom
    if (this.state.isExploring) {
      const zoomDelta = 1 + this.state.exploreSpeed * dt;
      this.state.targetZoom *= zoomDelta;

      // Gently ease pan toward center so the zoom moves into the bindu
      this.state.targetX += (0 - this.state.targetX) * 0.05;
      this.state.targetY += (0 - this.state.targetY) * 0.05;
    }

    // Spring damping interpolation
    const damping = Math.min(1.0, 10.0 * dt);
    this.state.x += (this.state.targetX - this.state.x) * damping;
    this.state.y += (this.state.targetY - this.state.y) * damping;
    this.state.zoom += (this.state.targetZoom - this.state.zoom) * damping;

    // Check if camera crossed the deep scene threshold
    let crossedDepthThreshold = false;
    if (this.state.zoom >= SEAMLESS_ZOOM_RATIO) {
      // Step into next nested depth layer: normalize zoom by exact seamless ratio
      const scaleDown = 1 / SEAMLESS_ZOOM_RATIO;
      this.state.zoom *= scaleDown;
      this.state.targetZoom *= scaleDown;
      this.state.x *= scaleDown;
      this.state.y *= scaleDown;
      this.state.targetX *= scaleDown;
      this.state.targetY *= scaleDown;
      this.state.depthOffset += 1;
      crossedDepthThreshold = true;
    }

    return {
      crossedDepthThreshold,
      newDepth: this.state.depthOffset,
    };
  }

  /**
   * Converts screen point to world coordinates.
   */
  screenToWorld(screenPt: Point, viewportWidth: number, viewportHeight: number): Point {
    const cx = viewportWidth / 2;
    const cy = viewportHeight / 2;
    return {
      x: (screenPt.x - cx) / this.state.zoom + this.state.x,
      y: (screenPt.y - cy) / this.state.zoom + this.state.y,
    };
  }

  /**
   * Converts world point to screen coordinates.
   */
  worldToScreen(worldPt: Point, viewportWidth: number, viewportHeight: number): Point {
    const cx = viewportWidth / 2;
    const cy = viewportHeight / 2;
    return {
      x: (worldPt.x - this.state.x) * this.state.zoom + cx,
      y: (worldPt.y - this.state.y) * this.state.zoom + cy,
    };
  }
}
