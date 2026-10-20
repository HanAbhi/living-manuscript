import { Sliders, X } from 'lucide-react';

export interface AppSettings {
  sectors: number; // 8, 12, 16, 24
  detailDensity: number; // 0.7 to 1.4
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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const sectorOptions = [8, 12, 16, 24];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(38, 37, 31, 0.45)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '460px',
          padding: '1.75rem',
          backgroundColor: '#FAF5ED',
          border: '1px solid var(--vellum-border-strong)',
          boxShadow: '0 12px 40px rgba(38, 37, 31, 0.2)',
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
            <Sliders size={18} color="var(--brass)" />
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
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
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Radial Symmetry Sectors */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontSize: '0.74rem',
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
                fontSize: '0.74rem',
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
                fontSize: '0.74rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
              }}
            >
              <span>Detail & Stippling Density</span>
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
                fontSize: '0.74rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                marginBottom: '0.4rem',
              }}
            >
              Graphite Compass Guides
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
              <span>Reduced Motion (Instant Drawing)</span>
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
