import { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Compass,
  Sparkles,
  Bookmark,
  Download,
  Sliders,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { AmbientAudioEngine } from '../audio/ambient';
import { AudioControls } from './AudioControls';
import type { AppSettings } from './SettingsModal';

interface ControlPanelProps {
  seed: string;
  sectors: number;
  progress: number;
  isPaused: boolean;
  isExploring: boolean;
  zoom: number;
  depthLevel: number;
  totalSpecimens: number;
  settings: AppSettings;
  audioEngine: AmbientAudioEngine;
  onTogglePlay: () => void;
  onRewind: () => void;
  onToggleExplore: () => void;
  onNewSeed: () => void;
  onSaveSpecimen: () => void;
  onScrubProgress: (newProgress: number) => void;
  onResetCamera: () => void;
  onOpenSpecimens: () => void;
  onOpenSettings: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  seed,
  sectors,
  progress,
  isPaused,
  isExploring,
  zoom,
  depthLevel,
  totalSpecimens,
  audioEngine,
  onTogglePlay,
  onRewind,
  onToggleExplore,
  onNewSeed,
  onSaveSpecimen,
  onScrubProgress,
  onResetCamera,
  onOpenSpecimens,
  onOpenSettings,
  onExportSVG,
  onExportPNG,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <>
      {/* Top Header Plate */}
      <header
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        {/* Title & Archival Specimen Plate */}
        <div style={{ pointerEvents: 'auto' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              fontWeight: 500,
              letterSpacing: '0.14em',
              color: 'var(--ink)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            The Living Manuscript
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '0.82rem',
              fontStyle: 'italic',
              color: 'var(--ink-faded)',
              letterSpacing: '0.04em',
              marginTop: '0.15rem',
            }}
          >
            A Study in Infinite Botanical Forms
          </p>

          <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="specimen-plate">
              <span style={{ color: 'var(--brass-hover)' }}>◆</span>
              <span>SPECIMEN {seed.slice(0, 10).toUpperCase()}</span>
              <span style={{ color: 'var(--vellum-border-strong)' }}>|</span>
              <span>{sectors}-FOLD SYMMETRY</span>
            </div>
            {depthLevel > 0 && (
              <div
                className="specimen-plate"
                style={{ borderColor: 'var(--brass)', background: 'var(--vellum-card-solid)' }}
              >
                <span>DEPTH TIER {depthLevel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Right Utility Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            pointerEvents: 'auto',
          }}
        >
          <AudioControls audioEngine={audioEngine} />

          <button
            onClick={onOpenSpecimens}
            className="desk-btn"
            title="View saved specimens"
            style={{ position: 'relative' }}
          >
            <Bookmark size={14} color="var(--brass)" />
            <span style={{ display: 'none' }}>Specimens</span>
            <span>Archive</span>
            {totalSpecimens > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  background: 'var(--ink)',
                  color: 'var(--vellum)',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '10px',
                }}
              >
                {totalSpecimens}
              </span>
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="desk-btn desk-btn-icon"
            title="Manuscript Settings"
            aria-label="Settings"
          >
            <Sliders size={15} />
          </button>
        </div>
      </header>

      {/* Floating Bottom Artist Desk Toolbar */}
      <footer
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '92%',
          maxWidth: '720px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        {/* Scrubber & Inking Progress Bar */}
        <div
          className="manuscript-card"
          style={{
            padding: '0.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-faded)',
            }}
          >
            <span>
              {progress >= 1.0
                ? '◆ INK CURED · COMPOSITION COMPLETE'
                : `◆ INKING IN PROGRESS · ${Math.round(progress * 100)}%`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>SCALE: {zoom.toFixed(2)}x</span>
              <button
                onClick={onResetCamera}
                className="desk-btn desk-btn-icon"
                style={{ width: '22px', height: '22px', padding: 0 }}
                title="Reset Camera to Center"
              >
                <Maximize2 size={11} />
              </button>
            </div>
          </div>

          {/* Interactive Progress Bar */}
          <div
            className="scrubber-track"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              onScrubProgress(fraction);
            }}
          >
            <div className="scrubber-fill" style={{ width: `${progress * 100}%` }}>
              <div className="scrubber-thumb" />
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div
          className="manuscript-card"
          style={{
            padding: '0.55rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Playback controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={onTogglePlay}
              className={`desk-btn ${!isPaused && progress < 1 ? 'desk-btn-primary' : ''}`}
              title={isPaused || progress >= 1 ? 'Draw / Resume (Space)' : 'Pause (Space)'}
            >
              {isPaused || progress >= 1 ? <Play size={13} /> : <Pause size={13} />}
              <span>{isPaused || progress >= 1 ? 'Draw' : 'Pause'}</span>
            </button>

            <button
              onClick={onRewind}
              className="desk-btn desk-btn-icon"
              title="Rewind Drawing to Bindu (R)"
              aria-label="Rewind"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Center: Generation & Explore */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={onToggleExplore}
              className={`desk-btn ${isExploring ? 'desk-btn-primary animate-pulse-glow' : ''}`}
              title="The Infinite Passage · Continuous Inward Zoom (Z)"
            >
              <Compass size={14} color={isExploring ? 'var(--vellum)' : 'var(--brass)'} />
              <span>{isExploring ? 'Exploring' : 'Explore'}</span>
            </button>

            <button
              onClick={onNewSeed}
              className="desk-btn"
              title="Generate New Botanical Seed (N)"
            >
              <Sparkles size={13} />
              <span>New Seed</span>
            </button>
          </div>

          {/* Right: Specimen & Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
            <button
              onClick={onSaveSpecimen}
              className="desk-btn"
              title="Bookmark Specimen to Archive (S)"
            >
              <Bookmark size={13} />
              <span>Keep</span>
            </button>

            {/* Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="desk-btn"
                title="Export Artwork"
              >
                <Download size={13} />
                <span>Export</span>
                <ChevronDown size={11} />
              </button>

              {showExportMenu && (
                <div
                  className="manuscript-card animate-fade-in"
                  style={{
                    position: 'absolute',
                    bottom: '120%',
                    right: 0,
                    width: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.4rem',
                    gap: '0.25rem',
                    backgroundColor: '#FAF5ED',
                    zIndex: 150,
                  }}
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <button
                    onClick={() => {
                      onExportSVG();
                      setShowExportMenu(false);
                    }}
                    className="desk-btn"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                  >
                    <span>Vector SVG (.svg)</span>
                  </button>
                  <button
                    onClick={() => {
                      onExportPNG();
                      setShowExportMenu(false);
                    }}
                    className="desk-btn"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                  >
                    <span>Print PNG (2400px)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
