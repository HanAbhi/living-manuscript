import { describe, it, expect } from 'vitest';
import { generateMandalaScene, generateNestedScene } from '../src/engine/scene';

describe('Scene Generator - Procedural Botanical Mandala', () => {
  it('generates reproducible composition for the same seed', () => {
    const scene1 = generateMandalaScene({ seed: 'SPECIMEN_ALPHA', sectors: 16 });
    const scene2 = generateMandalaScene({ seed: 'SPECIMEN_ALPHA', sectors: 16 });

    expect(scene1.strokes.length).toBe(scene2.strokes.length);
    expect(scene1.motifs).toEqual(scene2.motifs);
    expect(scene1.radii).toEqual(scene2.radii);
    expect(scene1.totalInkLength).toBeCloseTo(scene2.totalInkLength, 2);
  });

  it('generates monotonically increasing ring radii', () => {
    const scene = generateMandalaScene({ seed: 'RADIUS_TEST', sectors: 12 });
    for (let i = 1; i < scene.radii.length; i++) {
      expect(scene.radii[i]).toBeGreaterThan(scene.radii[i - 1]);
    }
  });

  it('includes construction guides and ink strokes', () => {
    const scene = generateMandalaScene({ seed: 'GUIDES_TEST', sectors: 8 });
    expect(scene.guideStrokes.length).toBeGreaterThan(0);
    expect(scene.inkStrokes.length).toBeGreaterThan(0);
    expect(scene.strokes.length).toBe(scene.guideStrokes.length + scene.inkStrokes.length);
  });

  it('generates valid nested scene for infinite zoom', () => {
    const rootScene = generateMandalaScene({ seed: 'ROOT_PASSAGE', sectors: 16 });
    const childScene = generateNestedScene(rootScene, 1);

    expect(childScene.depthLevel).toBe(1);
    expect(childScene.strokes.length).toBeGreaterThan(0);
    expect(childScene.seed).toBe('ROOT_PASSAGE-depth-1');
  });
});
