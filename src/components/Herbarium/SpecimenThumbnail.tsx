import { useState, useEffect, type FC } from 'react';
import type { HerbariumSpecimen } from '../../types/herbarium';
import { generateMandalaScene } from '../../engine/scene';
import { ManuscriptRenderer } from '../../engine/renderer';
import { Camera } from '../../engine/camera';

// In-memory cache for rendered thumbnails to avoid repeated canvas redraws
const thumbnailCache = new Map<string, string>();

interface SpecimenThumbnailProps {
  specimen: HerbariumSpecimen;
  size?: number; // CSS pixel dimensions (e.g. 100, 140)
  className?: string;
  onClick?: () => void;
}

export const SpecimenThumbnail: FC<SpecimenThumbnailProps> = ({
  specimen,
  size = 110,
  className = '',
  onClick,
}) => {
  const cacheKey = `${specimen.seed}_${specimen.sectors}_${specimen.preset}_${specimen.detailDensity}_${size}`;
  const [dataUrl, setDataUrl] = useState<string | null>(() => thumbnailCache.get(cacheKey) || null);

  useEffect(() => {
    if (thumbnailCache.has(cacheKey)) {
      setDataUrl(thumbnailCache.get(cacheKey)!);
      return;
    }

    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvasWidth = size * dpr;
      const canvasHeight = size * dpr;

      const offscreen = document.createElement('canvas');
      offscreen.width = canvasWidth;
      offscreen.height = canvasHeight;

      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      const scene = generateMandalaScene({
        seed: specimen.seed,
        sectors: specimen.sectors,
        preset: specimen.preset,
        detailDensity: specimen.detailDensity,
        baseRadius: 180,
      });

      const renderer = new ManuscriptRenderer();
      const camera = new Camera();

      // Fit composition with breathing margin
      const paddingRatio = 0.84;
      const zoom = (canvasWidth * paddingRatio * 0.5) / scene.maxRadius;
      camera.state.zoom = zoom;
      camera.state.targetZoom = zoom;
      camera.state.x = 0;
      camera.state.y = 0;

      renderer.render(
        ctx,
        canvasWidth,
        canvasHeight,
        scene,
        camera,
        1.0, // Fully inked
        {
          showGuides: false,
          fadeGuidesWithProgress: true,
          paperGrain: false,
        }
      );

      const url = offscreen.toDataURL('image/png');
      thumbnailCache.set(cacheKey, url);
      setDataUrl(url);
    } catch (err) {
      console.warn('Failed to generate thumbnail for specimen:', specimen.seed, err);
    }
  }, [cacheKey, size, specimen]);

  return (
    <div
      className={`specimen-thumbnail-frame ${className}`}
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: '#FAF5ED',
        borderRadius: '50%',
        boxShadow: 'inset 0 0 0 1px rgba(148, 139, 122, 0.4), 0 2px 8px rgba(34, 33, 28, 0.06)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={specimen.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            display: 'block',
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            border: '1px dashed var(--brass)',
            opacity: 0.4,
            animation: 'pulseGlow 2s infinite',
          }}
        />
      )}
    </div>
  );
};
