import { describe, it, expect } from 'vitest';
import { generateMandalaScene } from '../src/engine/scene';
import { generateSVGString, commandsToSVGPath } from '../src/export/svg';

describe('Export Engine - Vector SVG Serialization', () => {
  it('converts path commands accurately to SVG string', () => {
    const pathStr = commandsToSVGPath([
      { type: 'M', x: 10, y: 20 },
      { type: 'L', x: 30, y: 40 },
      { type: 'C', cp1x: 35, cp1y: 45, cp2x: 50, cp2y: 60, x: 70, y: 80 },
      { type: 'Z' },
    ]);

    expect(pathStr).toBe('M 10.00 20.00 L 30.00 40.00 C 35.00 45.00, 50.00 60.00, 70.00 80.00 Z');
  });

  it('generates well-formed SVG document with viewBox and title', () => {
    const scene = generateMandalaScene({ seed: 'SVG_TEST_01', sectors: 8 });
    const svg = generateSVGString(scene, { includeBackground: true, includeGuides: true });

    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="');
    expect(svg).toContain('Specimen SVG_TEST_01');
    expect(svg).toContain('<g id="ink-strokes"');
    expect(svg).toContain('</svg>');
  });
});
