# 📜 The Living Manuscript
### *A Study in Infinite Botanical Forms*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Firebase%20Hosting-blue?style=for-the-badge&logo=firebase&logoColor=white)](https://studio-7274329899-447c6.web.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **"The website should feel like opening an old botanical manuscript whose illustrations are still being drawn by an invisible hand."**

An interactive, browser-based generative art engine and digital sketchbook that paints intricate, sacred botanical mandalas in archival black ink on warm vellum in real time, featuring an infinite cosmic zoom passage into its geometry.

🌐 **Experience the Live Application**: **[https://studio-7274329899-447c6.web.app](https://studio-7274329899-447c6.web.app)**

---

## 🎨 Creative Direction & Aesthetic Restraint

The Living Manuscript rejects generic neon gradients, heavy artificial drop shadows, and repetitive AI patterns in favor of historical botanical engraving techniques:

* **Warm Vellum & Handmade Paper (`#F3EBDD`)**: Procedural paper grain with subtle organic fiber flecks and tooth texture.
* **Archival Black Ink (`#26251F`)**: Fine micron-pen linework with pressure sensitivity and micro-wobble imperfections that replicate physical nibs on paper.
* **Graphite Compass Guides (`#9B907C`)**: Concentric construction circles and radial spokes drafted at low opacity that gracefully fade as the ink cures.
* **Antique Brass Accents (`#A28A58`)**: Restrained metallic gold/brass highlights on nucleus beads and concentric dividers.
* **Pointillist Stippling & Micro-Hatching**: Delicate stipple shading clusters with quadratic falloff simulating hand-drawn chiaroscuro.

---

## ✨ Core Features

### 1. The Invisible Scribe (Real-Time Inking)
Rather than popping into view all at once, each composition visibly draws itself from the central *bindu* outward. Strokes follow Bézier arc-length parameterization via de Casteljau curve slicing, revealing smooth curves, leaf veins, and stipple clusters in rhythmic harmony.

### 2. Procedural Botanical Grammar
Every composition is procedurally synthesized from a reusable vocabulary of botanical organs:
* **Lotus Petals**: Double-line contour arches, central spine veins, and radiating lateral capillaries with base shadow stippling.
* **Fern Fronds**: Arching stems carrying alternating pinnate leaflets with organic phyllotaxis.
* **Seed Pods**: Ovoid urn capsules with dense pointillist chiaroscuro and fluted star crowns.
* **Curling Tendrils**: Logarithmic spiral tendrils terminating in microscopic ink droplets.
* **Paisley / Acanthus**: Flowing recurved teardrop profiles with internal cross-hatching.
* **Architectural Dividers**: Concentric strings of pearls, scalloped arches, and chevron bands separating tiers.

### 3. The Infinite Passage (Endless Meditative Zoom)
The finished drawing becomes a portal. Activating **Explore Mode** initiates a smooth, continuous logarithmic zoom into the geometry. As outer rings expand past the viewport, a hierarchical scene graph seamlessly generates new microscopic botanical tiers inside the central bindu with adaptive stroke-width compensation to preserve pen-plotter crispness.

### 4. Synthesized Ambient Soundscape
Built on the **Web Audio API** without external audio samples:
* **Harmonic Drone**: Calming multi-oscillator tanpura/singing-bowl drone tuned to sacred $A = 432\text{ Hz}$ with organic chorus detuning and warm low-pass filtering.
* **Ring Bloom Chimes**: Crystalline Tibetan singing-bowl partials triggered as each concentric tier unfolds.
* Controlled via an artist desk audio panel with mute toggle and volume slider (disabled by default until user interaction).

### 5. Specimen Archive & High-Resolution Exports
* **Specimen Archive**: Save favorite botanical discoveries to local storage, complete with seed tags, symmetry counts, and motif breakdowns.
* **Vector SVG Export (`.svg`)**: Clean, scalable vector paths optimized for laser engravers, CNC vinyl cutters, and pen plotters.
* **Print-Ready PNG Export (`.png`)**: High-DPI offscreen canvas snapshot rendered at $2400 \times 2400$ resolution with paper tooth texture.

---

## 📐 Mathematical Foundations

### Radial & Dihedral Symmetry
For an $N$-fold radial symmetry, each point $(r, \theta)$ in the fundamental sector is replicated across all sectors:
$$\theta_k = \theta + \frac{2\pi k}{N}, \quad k \in \{0, 1, \dots, N - 1\}$$

In dihedral (bilateral reflection) mode, strokes are reflected across each sector's radial bisector:
$$\theta_{\text{bisector}} = \theta_k + \frac{\pi}{N}$$

### Deterministic Seeded PRNG
All randomness is governed by a deterministic **Mulberry32** generator, guaranteeing that any seed string (e.g., `LOTUS-7429`, `PAPAVER-3201`) reproduces the identical botanical specimen across different browsers and sessions:

```typescript
function mulberry32(state: number) {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :---: | :--- |
| <kbd>Space</kbd> | Pause / Resume drawing sequence |
| <kbd>R</kbd> | Rewind drawing back to the central bindu |
| <kbd>N</kbd> | Generate a fresh botanical seed |
| <kbd>Z</kbd> | Toggle **The Infinite Passage** continuous zoom |
| <kbd>S</kbd> | Bookmark current specimen to archive |
| <kbd>Esc</kbd> | Reset camera to center or close drawers |

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: React 19, TypeScript 5, Vite 8
* **Rendering**: HTML5 Canvas 2D (High-DPI retina rendering with sub-pixel interpolation)
* **Icons**: Lucide React
* **Typography**: *Cormorant Garamond*, *Cinzel*, and *JetBrains Mono*
* **Sound**: Native Web Audio API
* **Unit Testing**: Vitest (14 automated unit tests verifying geometry, symmetry, deterministic seeds, and export serialization)
* **Hosting**: Firebase Hosting

```
living-manuscript/
├── src/
│   ├── engine/
│   │   ├── random.ts       # Deterministic Mulberry32 PRNG & noise
│   │   ├── geometry.ts     # Polar math, Bézier slicing, wobble perturbations
│   │   ├── symmetry.ts     # Radial replication & dihedral reflection
│   │   ├── botanicals.ts   # Botanical organ generators (Lotus, Fern, Pod, etc.)
│   │   ├── scene.ts        # Concentric scene graph & nested infinite portals
│   │   ├── camera.ts       # Spring-damped camera & auto-exploration
│   │   └── renderer.ts     # Canvas 2D rendering pipeline & vellum texture
│   ├── audio/
│   │   └── ambient.ts      # Web Audio API harmonic drones & singing bowls
│   ├── export/
│   │   ├── svg.ts          # Vector SVG serializer
│   │   └── png.ts          # High-resolution 2400x2400 PNG snapshotter
│   ├── components/
│   │   ├── ArtCanvas.tsx   # Canvas viewport with mouse/touch/pinch handlers
│   │   ├── ControlPanel.tsx# Floating manuscript desk toolbar & scrubber
│   │   ├── SpecimenPanel.tsx# Saved specimen bookmark drawer
│   │   ├── AudioControls.tsx# Minimalist volume & drone toggles
│   │   └── SettingsModal.tsx# Symmetry, cadence, and density preferences
│   ├── App.tsx
│   └── index.css
├── tests/
│   ├── random.test.ts      # PRNG determinism & distribution tests
│   ├── symmetry.test.ts    # Symmetry replication invariant tests
│   ├── scene.test.ts       # Scene hierarchy & radius tests
│   └── export.test.ts      # SVG serialization format tests
└── firebase.json           # Firebase Hosting configuration
```

---

## 🚀 Local Development

### Prerequisites
* Node.js $\ge 18$
* npm $\ge 9$

### Setup & Run
```bash
# 1. Clone the repository
git clone git@github.com:HanAbhi/living-manuscript.git
cd living-manuscript

# 2. Install dependencies
npm install

# 3. Run unit tests
npm test

# 4. Start local development server
npm run dev
```

Open `http://localhost:5174` in your browser.

### Build Production Bundle
```bash
npm run build
```

---

## 📄 License
Released under the [MIT License](LICENSE).
