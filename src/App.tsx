import { useState, useEffect, useRef, useCallback } from 'react';
import { ArtCanvas } from './components/ArtCanvas';
import { ControlPanel } from './components/ControlPanel';
import { HerbariumModal } from './components/Herbarium/HerbariumModal';
import {
  loadHerbariumJournal,
  saveHerbariumJournal,
  determineMotifFamily,
  generateBotanicalTitle,
  type HerbariumJournalData,
  type HerbariumSpecimen,
} from './types/herbarium';
import { SettingsModal, type AppSettings } from './components/SettingsModal';
import { generateMandalaScene, type MandalaScene, type CompositionPreset } from './engine/scene';
import { Camera } from './engine/camera';
import { AmbientAudioEngine } from './audio/ambient';
import { downloadSVG } from './export/svg';
import { downloadHighResPNG } from './export/png';

const DEFAULT_SETTINGS: AppSettings = {
  preset: 'ornate',
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
      const params = new URLSearchParams(window.location.search);
      const presetParam = params.get('preset') as CompositionPreset | null;
      const saved = localStorage.getItem('living_manuscript_settings');
      const base = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
      if (presetParam && ['sparse', 'ornate', 'wild'].includes(presetParam)) {
        base.preset = presetParam;
      }
      return base;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Herbarium Journal storage and active record state
  const [journal, setJournal] = useState<HerbariumJournalData>(() => loadHerbariumJournal());
  const [initialSpecimenId, setInitialSpecimenId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<{
    specimen: HerbariumSpecimen;
    visible: boolean;
  } | null>(null);

  // Auto-persist Herbarium journal
  useEffect(() => {
    saveHerbariumJournal(journal);
  }, [journal]);

  // Auto-dismiss save notification toast
  useEffect(() => {
    if (saveToast?.visible) {
      const timer = setTimeout(() => {
        setSaveToast(null);
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  // Core drawing and camera state
  const [seed, setSeed] = useState<string>(() => {
    try {
      const s = new URLSearchParams(window.location.search).get('seed');
      return s || 'SPECIMEN-0001';
    } catch {
      return 'SPECIMEN-0001';
    }
  });
  const [scene, setScene] = useState<MandalaScene>(() =>
    generateMandalaScene({
      seed: new URLSearchParams(window.location.search).get('seed') || 'SPECIMEN-0001',
      sectors: settings.sectors,
      preset: settings.preset,
      detailDensity: settings.detailDensity,
    })
  );

  const [progress, setRawProgress] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('progress');
      return p !== null ? Math.max(0, Math.min(1, parseFloat(p))) : 0.0;
    } catch {
      return 0.0;
    }
  });
  const setProgress = useCallback((val: number) => {
    setRawProgress(Math.max(0.0, Math.min(1.0, val)));
  }, []);
  const [isPaused, setIsPaused] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [depthLevel, setDepthLevel] = useState(0);

  // Modals
  const [isSpecimenOpen, setIsSpecimenOpen] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('herbarium') === '1';
    } catch {
      return false;
    }
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Engines
  const cameraRef = useRef<Camera>(null!);
  if (!cameraRef.current) {
    const cam = new Camera();
    try {
      const z = new URLSearchParams(window.location.search).get('zoom');
      if (z) {
        const val = parseFloat(z);
        if (!isNaN(val) && val > 0) {
          cam.state.zoom = val;
          cam.state.targetZoom = val;
        }
      }
    } catch {
      // Ignore
    }
    cameraRef.current = cam;
  }
  const audioEngineRef = useRef<AmbientAudioEngine>(new AmbientAudioEngine());

  // Save settings on update
  useEffect(() => {
    try {
      localStorage.setItem('living_manuscript_settings', JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);



  // Generation of new seed
  const handleNewSeed = useCallback(() => {
    const newSeed = generateArchivalSeed();
    setSeed(newSeed);
    const newScene = generateMandalaScene({
      seed: newSeed,
      sectors: settings.sectors,
      preset: settings.preset,
      detailDensity: settings.detailDensity,
      depthLevel: 0,
    });
    setScene(newScene);
    setProgress(0.0);
    setIsPaused(false);
    setDepthLevel(0);
    cameraRef.current.reset();
    setIsExploring(false);
  }, [settings.sectors, settings.preset, settings.detailDensity]);

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

  // Inscribe Specimen into Herbarium
  const handleSaveSpecimen = useCallback(() => {
    const family = determineMotifFamily(scene.motifs);
    const nextNumber = journal.specimens.length + 1;
    const title = generateBotanicalTitle(seed, family, nextNumber);

    const newSpecimen: HerbariumSpecimen = {
      id: `herb-${seed}-${Date.now()}`,
      specimenNumber: nextNumber,
      seed,
      sectors: scene.sectors,
      preset: settings.preset,
      detailDensity: settings.detailDensity,
      motifs: scene.motifs,
      family,
      title,
      notes: '',
      timestamp: Date.now(),
      isFavorite: false,
    };

    setJournal((prev) => ({
      ...prev,
      specimens: [newSpecimen, ...prev.specimens],
    }));

    setSaveToast({ specimen: newSpecimen, visible: true });
    audioEngineRef.current.playRingChime(1);
  }, [seed, scene.sectors, scene.motifs, settings.preset, settings.detailDensity, journal.specimens.length]);

  // Load Saved Specimen with EXACT Original Generation Settings
  const handleLoadSpecimen = useCallback(
    (specimen: HerbariumSpecimen) => {
      setSeed(specimen.seed);
      setSettings((prev) => ({
        ...prev,
        sectors: specimen.sectors,
        preset: specimen.preset,
        detailDensity: specimen.detailDensity,
      }));
      const restoredScene = generateMandalaScene({
        seed: specimen.seed,
        sectors: specimen.sectors,
        preset: specimen.preset,
        detailDensity: specimen.detailDensity,
        depthLevel: 0,
      });
      setScene(restoredScene);
      setProgress(1.0); // Reveal restored composition in full glory
      setIsPaused(true);
      setDepthLevel(0);
      cameraRef.current.reset();
      setIsExploring(false);
    },
    [setProgress]
  );

  // Switch Composition Preset directly
  const handleSelectPreset = useCallback(
    (newPreset: CompositionPreset) => {
      setSettings((prev) => ({ ...prev, preset: newPreset }));
      const regenerated = generateMandalaScene({
        seed,
        sectors: settings.sectors,
        preset: newPreset,
        detailDensity: settings.detailDensity,
        depthLevel,
      });
      setScene(regenerated);
    },
    [seed, settings.sectors, settings.detailDensity, depthLevel]
  );

  // Update Settings
  const handleUpdateSettings = useCallback(
    (newPartial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newPartial };
        // If sectors, density, or preset changed, regenerate scene
        if (
          (newPartial.sectors && newPartial.sectors !== prev.sectors) ||
          (newPartial.detailDensity && newPartial.detailDensity !== prev.detailDensity) ||
          (newPartial.preset && newPartial.preset !== prev.preset)
        ) {
          const regenerated = generateMandalaScene({
            seed,
            sectors: updated.sectors,
            preset: updated.preset,
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
        case 'KeyH':
          e.preventDefault();
          setIsSpecimenOpen((prev) => !prev);
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
        totalSpecimens={journal.specimens.length}
        settings={settings}
        audioEngine={audioEngineRef.current}
        onTogglePlay={handleTogglePlay}
        onRewind={handleRewind}
        onToggleExplore={handleToggleExplore}
        onNewSeed={handleNewSeed}
        onSaveSpecimen={handleSaveSpecimen}
        onScrubProgress={setProgress}
        onResetCamera={handleResetCamera}
        onOpenSpecimens={() => {
          setInitialSpecimenId(null);
          setIsSpecimenOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectPreset={handleSelectPreset}
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
      />

      {/* The Herbarium Journal Modal */}
      <HerbariumModal
        isOpen={isSpecimenOpen}
        onClose={() => {
          setIsSpecimenOpen(false);
          setInitialSpecimenId(null);
        }}
        journal={journal}
        onLoadSpecimen={handleLoadSpecimen}
        onUpdateJournal={setJournal}
        initialSpecimenId={initialSpecimenId}
      />

      {/* Archival Save Confirmation Toast */}
      {saveToast?.visible && (
        <div
          className="manuscript-card animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '6.4rem',
            right: '1.5rem',
            padding: '0.65rem 1rem',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#FAF5ED',
            border: '1px solid var(--brass)',
            boxShadow: '0 4px 18px rgba(34, 33, 28, 0.12)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                color: 'var(--brass-hover)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              ◆ Inscribed in The Herbarium
            </span>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '0.88rem',
                fontStyle: 'italic',
                color: 'var(--ink)',
              }}
            >
              Tab. {saveToast.specimen.specimenNumber.toString().padStart(2, '0')} · {saveToast.specimen.title}
            </span>
          </div>

          <button
            onClick={() => {
              setInitialSpecimenId(saveToast.specimen.id);
              setIsSpecimenOpen(true);
              setSaveToast(null);
            }}
            className="desk-btn"
            style={{
              padding: '0.25rem 0.65rem',
              fontSize: '0.68rem',
              background: 'var(--ink)',
              color: 'var(--vellum)',
              borderColor: 'var(--ink)',
            }}
          >
            Open Journal
          </button>
        </div>
      )}

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
