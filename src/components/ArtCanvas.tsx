import { useRef, useEffect, useCallback } from 'react';
import { generateNestedScene, type MandalaScene } from '../engine/scene';
import { Camera } from '../engine/camera';
import { ManuscriptRenderer, type RenderOptions } from '../engine/renderer';
import { AmbientAudioEngine } from '../audio/ambient';
import type { AppSettings } from './SettingsModal';

interface ArtCanvasProps {
  scene: MandalaScene;
  camera: Camera;
  progress: number;
  isPaused: boolean;
  settings: AppSettings;
  audioEngine: AmbientAudioEngine;
  onProgressUpdate: (progress: number) => void;
  onCameraUpdate: (zoom: number, depthLevel: number) => void;
  onSceneTransition: (newScene: MandalaScene, depthLevel: number) => void;
}

export const ArtCanvas: React.FC<ArtCanvasProps> = ({
  scene,
  camera,
  progress,
  isPaused,
  settings,
  audioEngine,
  onProgressUpdate,
  onCameraUpdate,
  onSceneTransition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ManuscriptRenderer>(new ManuscriptRenderer());
  const childSceneRef = useRef<MandalaScene | null>(null);

  // References for animation loop state to avoid React re-render lag
  const progressRef = useRef(progress);
  const isPausedRef = useRef(isPaused);
  const settingsRef = useRef(settings);
  const sceneRef = useRef(scene);
  const chimeTrackerRef = useRef<{ [ring: number]: boolean }>({});

  progressRef.current = progress;
  isPausedRef.current = isPaused;
  settingsRef.current = settings;
  sceneRef.current = scene;

  // Touch and drag tracking
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const touchDistRef = useRef<number | null>(null);

  // Synchronize child scene whenever parent scene changes
  useEffect(() => {
    childSceneRef.current = generateNestedScene(scene, scene.depthLevel + 1);
    chimeTrackerRef.current = {};
  }, [scene]);

  // Main animation frame loop
  useEffect(() => {
    let animId: number;
    let lastTime = 0;

    const loop = (currentTime: number) => {
      if (!lastTime || currentTime < lastTime) {
        lastTime = currentTime;
      }
      const dtMs = Math.max(0, Math.min(currentTime - lastTime, 100));
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      // 1. Advance Progressive Inking
      if (settingsRef.current.reducedMotion) {
        if (progressRef.current < 1.0) {
          progressRef.current = 1.0;
          onProgressUpdate(1.0);
        }
      } else if (!isPausedRef.current && progressRef.current < 1.0) {
        const baseDurationSec = 14.0;
        const progressDelta = (dtMs / 1000) * (1 / baseDurationSec) * settingsRef.current.drawingSpeed;
        const nextProgress = Math.max(0.0, Math.min(1.0, progressRef.current + progressDelta));
        progressRef.current = nextProgress;
        onProgressUpdate(nextProgress);

        // Sound cue: ring bloom chime as each concentric tier unfolds
        const currentRing = Math.floor(nextProgress * sceneRef.current.radii.length);
        if (currentRing > 0 && !chimeTrackerRef.current[currentRing]) {
          chimeTrackerRef.current[currentRing] = true;
          audioEngine.playRingChime(currentRing);
        }
      }

      // 2. Update Camera Physics & Infinite Passage Depth Check
      const { crossedDepthThreshold, newDepth } = camera.update(dtMs);
      onCameraUpdate(camera.state.zoom, camera.state.depthOffset);

      if (crossedDepthThreshold && childSceneRef.current) {
        // Deep zoom threshold reached: promote child scene to current scene!
        const nextParent = childSceneRef.current;
        sceneRef.current = nextParent;
        childSceneRef.current = generateNestedScene(nextParent, newDepth + 1);
        onSceneTransition(nextParent, newDepth);
        audioEngine.playRingChime(0);
      }

      // 3. Render High-DPI Canvas Frame
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      const renderOpts: RenderOptions = {
        showGuides: settingsRef.current.guideMode !== 'hidden',
        fadeGuidesWithProgress: settingsRef.current.guideMode === 'fade',
        paperGrain: settingsRef.current.paperGrain,
      };

      rendererRef.current.render(
        ctx,
        width,
        height,
        sceneRef.current,
        camera,
        progressRef.current,
        renderOpts,
        childSceneRef.current
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [camera, audioEngine, onProgressUpdate, onCameraUpdate, onSceneTransition]);

  // Window Resize & High-DPI handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    camera.pan(dx, dy);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.09 : 0.91;
    camera.zoomAt(factor, e.clientX, e.clientY, window.innerWidth, window.innerHeight);
  };

  // Touch Handlers (Pinch-to-zoom & single finger pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - lastMousePosRef.current.x;
      const dy = e.touches[0].clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      camera.pan(dx, dy);
    } else if (e.touches.length === 2 && touchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = newDist / touchDistRef.current;
      touchDistRef.current = newDist;

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      camera.zoomAt(factor, midX, midY, window.innerWidth, window.innerHeight);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchDistRef.current = null;
  };

  const handleDoubleClick = () => {
    camera.reset();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: isDraggingRef.current ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    />
  );
};
