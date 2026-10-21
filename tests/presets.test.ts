import { describe, it, expect } from 'vitest';
import { generateMandalaScene, generateNestedScene, SEAMLESS_ZOOM_RATIO } from '../src/engine/scene';

describe('Scene Presets & Hierarchical Grammar', () => {
  it('generates distinct geometries for sparse, ornate, and wild presets', () => {
    const seed = 'PRESET_TEST_SEED_99';
    const sparseScene = generateMandalaScene({ seed, preset: 'sparse' });
    const ornateScene = generateMandalaScene({ seed, preset: 'ornate' });
    const wildScene = generateMandalaScene({ seed, preset: 'wild' });

    // Presets should produce different stroke counts and motif arrangements
    expect(sparseScene.preset).toBe('sparse');
    expect(ornateScene.preset).toBe('ornate');
    expect(wildScene.preset).toBe('wild');

    expect(sparseScene.strokes.length).not.toBe(ornateScene.strokes.length);
    expect(ornateScene.strokes.length).toBeGreaterThan(sparseScene.strokes.length);
  });

  it('guarantees deterministic output for presets with the same seed', () => {
    const s1 = generateMandalaScene({ seed: 'BOTANICAL_DETERMINISM', preset: 'ornate' });
    const s2 = generateMandalaScene({ seed: 'BOTANICAL_DETERMINISM', preset: 'ornate' });

    expect(s1.strokes.length).toBe(s2.strokes.length);
    expect(s1.totalInkLength).toBeCloseTo(s2.totalInkLength, 2);
    expect(s1.radii).toEqual(s2.radii);
    expect(s1.motifs).toEqual(s2.motifs);
  });

  it('preserves user settings including detail density and preset across nested scenes', () => {
    const root = generateMandalaScene({
      seed: 'PRESERVE_SETTINGS',
      preset: 'wild',
      detailDensity: 0.85,
      sectors: 12,
    });

    const child = generateNestedScene(root, 1);
    expect(child.preset).toBe('wild');
    expect(child.detailDensity).toBe(root.detailDensity);
    expect(child.sectors).toBe(root.sectors);
  });

  it('ensures SEAMLESS_ZOOM_RATIO matches the medallion core ratio', () => {
    const scene = generateMandalaScene({ seed: 'RATIO_TEST' });
    const coreRadius = scene.radii[0];
    const maxRadius = scene.maxRadius;
    const computedRatio = maxRadius / coreRadius;

    expect(computedRatio).toBeCloseTo(SEAMLESS_ZOOM_RATIO, 4);
  });
});
