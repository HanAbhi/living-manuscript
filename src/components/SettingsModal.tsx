import type { FC } from 'react';
import { Sliders, X } from 'lucide-react';
import type { CompositionPreset } from '../engine/scene';

export interface AppSettings {
  preset: CompositionPreset; // 'sparse' | 'ornate' | 'wild'
  sectors: number; // 8, 12, 16, 24
  detailDensity: number; // 0.6 to 1.4
  drawingSpeed: number; // 0.5 to 3.0
  paperGrain: boolean;
  guideMode: 'fade' | 'always' | 'hidden';
  reducedMotion: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const sectorOptions = [8, 12, 16, 24];

  const presets: { id: CompositionPreset; label: string; desc: string }[] = [
    {
      id: 'sparse',
      label: 'Herbarium',
      desc: 'Delicate solitary specimen with generous breathing space',
    },
    {
      id: 'ornate',
      label: 'Manuscript',
      desc: 'Classical copperplate engraving with rich directional hatching',
    },
    {
      id: 'wild',
      label: 'Flourish',
      desc: 'Botanical surrealism with spiraling tendrils & acanthus',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(34, 33, 28, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 210,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="manuscript-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          backgroundColor: '#FAF5ED',
          border: '1px solid var(--vellum-border-strong)',
          boxShadow: '0 12px 36px rgba(34, 33, 28, 0.16)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--vellum-border)',
            paddingBottom: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={17} color="var(--brass)" />
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.98rem',
                letterSpacing: '0.08em',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Manuscript Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="desk-btn desk-btn-icon"
            aria-label="Close settings"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          {/* Creative Composition Preset */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                marginBottom: '0.45rem',
              }}
            >
              Composition Aesthetic
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {presets.map((p) => {
                const isActive = settings.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onUpdateSettings({ preset: p.id })}
                    className={`desk-btn ${isActive ? 'desk-btn-primary' : ''}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.55rem 0.85rem',
                      gap: '0.15rem',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontWeight: 600, letterSpacing: '0.06em' }}>{p.label}</span>
                      {isActive && <span style={{ fontSize: '0.62rem', color: 'var(--brass-light)' }}>ACTIVE</span>}
                    </div>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        opacity: isActive ? 0.9 : 0.7,
                        textTransform: 'none',
                        letterSpacing: 'normal',
                      }}
                    >
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Radial Symmetry Sectors */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                marginBottom: '0.4rem',
              }}
            >
              Radial Symmetry Sectors
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {sectorOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => onUpdateSettings({ sectors: n })}
                  className={`desk-btn ${settings.sectors === n ? 'desk-btn-primary' : ''}`}
                  style={{ flex: 1, padding: '0.4rem 0.2rem' }}
                >
                  {n}-Fold
                </button>
              ))}
            </div>
          </div>

          {/* Drawing Speed */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
              }}
            >
              <span>Drawing Cadence</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{settings.drawingSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.25"
              value={settings.drawingSpeed}
              onChange={(e) => onUpdateSettings({ drawingSpeed: parseFloat(e.target.value) })}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--ink-muted)',
                marginTop: '0.2rem',
              }}
            >
              <span>Deliberate</span>
              <span>Moderate</span>
              <span>Brisk</span>
            </div>
          </div>

          {/* Botanical Detail Density */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
              }}
            >
              <span>Engraving Density & Hatching</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {Math.round(settings.detailDensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.1"
              value={settings.detailDensity}
              onChange={(e) => onUpdateSettings({ detailDensity: parseFloat(e.target.value) })}
            />
          </div>

          {/* Construction Guide Mode */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                marginBottom: '0.4rem',
              }}
            >
              Compass & Ray Construction Guides
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(
                [
                  { id: 'fade', label: 'Cure / Fade' },
                  { id: 'always', label: 'Always' },
                  { id: 'hidden', label: 'Hidden' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onUpdateSettings({ guideMode: mode.id })}
                  className={`desk-btn ${settings.guideMode === mode.id ? 'desk-btn-primary' : ''}`}
                  style={{ flex: 1, padding: '0.4rem 0.2rem' }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paper Texture & Motion Toggles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--vellum-border)',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              <span>Handmade Vellum Tooth Grain</span>
              <input
                type="checkbox"
                checked={settings.paperGrain}
                onChange={(e) => onUpdateSettings({ paperGrain: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--brass)' }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '0.78rem',
              }}
            >
              <span>Reduced Motion (Instant Render)</span>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--brass)' }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
