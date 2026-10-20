import { useState, useEffect, useRef, useCallback } from 'react';
import { ArtCanvas } from './components/ArtCanvas';
import { ControlPanel } from './components/ControlPanel';
import { SpecimenPanel, type SavedSpecimen } from './components/SpecimenPanel';
import { SettingsModal, type AppSettings } from './components/SettingsModal';
import { generateMandalaScene, type MandalaScene } from './engine/scene';
import { Camera } from './engine/camera';
import { AmbientAudioEngine } from './audio/ambient';
import { downloadSVG } from './export/svg';
import { downloadHighResPNG } from './export/png';

const DEFAULT_SETTINGS: AppSettings = {
  sectors: 16,
  detailDensity: 1.0,
  drawingSpeed: 1.0,
  paperGrain: true,
  guideMode: 'fade',
  reducedMotion: false,
};

const BOTANICAL_NAMES = [
  'LOTUS',
  'ACANTHUS',
  'PAPAVER',
  'EUPHORBIA',
  'NARCISSUS',
  'JASMINE',
  'CHELIDONIUM',
  'MAGNOLIA',
  'PASSIFLORA',
  'IRIS',
  'CYCLAMEN',
  'ANEMONE',
];

function generateArchivalSeed(): string {
  const name = BOTANICAL_NAMES[Math.floor(Math.random() * BOTANICAL_NAMES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${name}-${num}`;
}

export function App() {
  // Local storage initialization for settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('living_manuscript_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Local storage initialization for bookmarked specimens
  const [specimens, setSpecimens] = useState<SavedSpecimen[]>(() => {
    try {
      const saved = localStorage.getItem('living_manuscript_specimens');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Core drawing and camera state
  const [seed, setSeed] = useState<string>('SPECIMEN-0001');
  const [scene, setScene] = useState<MandalaScene>(() =>
    generateMandalaScene({
      seed: 'SPECIMEN-0001',
      sectors: settings.sectors,
      detailDensity: settings.detailDensity,
    })
  );

  const [progress, setProgress] = useState(0.0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [depthLevel, setDepthLevel] = useState(0);

  // Modals
  const [isSpecimenOpen, setIsSpecimenOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Engines
  const cameraRef = useRef<Camera>(new Camera());
  const audioEngineRef = useRef<AmbientAudioEngine>(new AmbientAudioEngine());

  // Save settings on update
  useEffect(() => {
    try {
      localStorage.setItem('living_manuscript_settings', JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Save specimens on update
  useEffect(() => {
    try {
      localStorage.setItem('living_manuscript_specimens', JSON.stringify(specimens));
    } catch {
      // Ignore
    }
  }, [specimens]);

  // Generation of new seed
  const handleNewSeed = useCallback(() => {
    const newSeed = generateArchivalSeed();
    setSeed(newSeed);
    const newScene = generateMandalaScene({
      seed: newSeed,
      sectors: settings.sectors,
      detailDensity: settings.detailDensity,
      depthLevel: 0,
    });
    setScene(newScene);
    setProgress(0.0);
    setIsPaused(false);
    setDepthLevel(0);
    cameraRef.current.reset();
    setIsExploring(false);
  }, [settings.sectors, settings.detailDensity]);

  // Play / Pause toggle
  const handleTogglePlay = useCallback(() => {
    if (progress >= 1.0) {
      setProgress(0.0);
      setIsPaused(false);
    } else {
      setIsPaused((prev) => !prev);
    }
  }, [progress]);

  // Rewind drawing
  const handleRewind = useCallback(() => {
    setProgress(0.0);
    setIsPaused(false);
  }, []);

  // Toggle Continuous Inward Explore Zoom
  const handleToggleExplore = useCallback(() => {
    const exploring = cameraRef.current.toggleExplore();
    setIsExploring(exploring);
  }, []);

  // Reset Camera
  const handleResetCamera = useCallback(() => {
    cameraRef.current.reset();
    setIsExploring(false);
    setZoom(1.0);
  }, []);

  // Save Specimen Bookmark
  const handleSaveSpecimen = useCallback(() => {
    const newSpecimen: SavedSpecimen = {
      id: `${seed}-${Date.now()}`,
      seed,
      sectors: scene.sectors,
      motifs: scene.motifs,
      timestamp: Date.now(),
    };
    setSpecimens((prev) => [newSpecimen, ...prev.filter((s) => s.seed !== seed)]);
    setIsSpecimenOpen(true);
  }, [seed, scene.sectors, scene.motifs]);

  // Load Saved Specimen
  const handleLoadSpecimen = useCallback(
    (specimen: SavedSpecimen) => {
      setSeed(specimen.seed);
      setSettings((prev) => ({ ...prev, sectors: specimen.sectors }));
      const newScene = generateMandalaScene({
        seed: specimen.seed,
        sectors: specimen.sectors,
        detailDensity: settings.detailDensity,
        depthLevel: 0,
      });
      setScene(newScene);
      setProgress(0.0);
      setIsPaused(false);
      setDepthLevel(0);
      cameraRef.current.reset();
      setIsExploring(false);
    },
    [settings.detailDensity]
  );

  // Delete Specimen
  const handleDeleteSpecimen = useCallback((id: string) => {
    setSpecimens((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Update Settings
  const handleUpdateSettings = useCallback(
    (newPartial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newPartial };
        // If sectors or density changed, regenerate scene
        if (
          (newPartial.sectors && newPartial.sectors !== prev.sectors) ||
          (newPartial.detailDensity && newPartial.detailDensity !== prev.detailDensity)
        ) {
          const regenerated = generateMandalaScene({
            seed,
            sectors: updated.sectors,
            detailDensity: updated.detailDensity,
            depthLevel,
          });
          setScene(regenerated);
        }
        return updated;
      });
    },
    [seed, depthLevel]
  );

  // Scene transition during infinite zoom
  const handleSceneTransition = useCallback((newScene: MandalaScene, newDepth: number) => {
    setScene(newScene);
    setDepthLevel(newDepth);
  }, []);

  // Exports
  const handleExportSVG = useCallback(() => {
    downloadSVG(scene, {
      includeBackground: true,
      includeGuides: settings.guideMode !== 'hidden',
    });
  }, [scene, settings.guideMode]);

  const handleExportPNG = useCallback(() => {
    downloadHighResPNG(scene, {
      size: 2400,
      includeGuides: settings.guideMode !== 'hidden',
    });
  }, [scene, settings.guideMode]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'KeyR':
          e.preventDefault();
          handleRewind();
          break;
        case 'KeyN':
          e.preventDefault();
          handleNewSeed();
          break;
        case 'KeyZ':
          e.preventDefault();
          handleToggleExplore();
          break;
        case 'KeyS':
          e.preventDefault();
          handleSaveSpecimen();
          break;
        case 'Escape':
          setIsSpecimenOpen(false);
          setIsSettingsOpen(false);
          handleResetCamera();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTogglePlay,
    handleRewind,
    handleNewSeed,
    handleToggleExplore,
    handleSaveSpecimen,
    handleResetCamera,
  ]);

  return (
    <main
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--vellum)',
      }}
    >
      {/* 2D Canvas Viewport */}
      <ArtCanvas
        scene={scene}
        camera={cameraRef.current}
        progress={progress}
        isPaused={isPaused}
        settings={settings}
        audioEngine={audioEngineRef.current}
        onProgressUpdate={setProgress}
        onCameraUpdate={(curZoom, curDepth) => {
          setZoom(curZoom);
          setDepthLevel(curDepth);
        }}
        onSceneTransition={handleSceneTransition}
      />

      {/* Minimalist Manuscript Desk Control Interface */}
      <ControlPanel
        seed={seed}
        sectors={scene.sectors}
        progress={progress}
        isPaused={isPaused}
        isExploring={isExploring}
        zoom={zoom}
        depthLevel={depthLevel}
        totalSpecimens={specimens.length}
        settings={settings}
        audioEngine={audioEngineRef.current}
        onTogglePlay={handleTogglePlay}
        onRewind={handleRewind}
        onToggleExplore={handleToggleExplore}
        onNewSeed={handleNewSeed}
        onSaveSpecimen={handleSaveSpecimen}
        onScrubProgress={setProgress}
        onResetCamera={handleResetCamera}
        onOpenSpecimens={() => setIsSpecimenOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
      />

      {/* Saved Specimens Drawer */}
      <SpecimenPanel
        isOpen={isSpecimenOpen}
        onClose={() => setIsSpecimenOpen(false)}
        specimens={specimens}
        onLoadSpecimen={handleLoadSpecimen}
        onDeleteSpecimen={handleDeleteSpecimen}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </main>
  );
}

export default App;
