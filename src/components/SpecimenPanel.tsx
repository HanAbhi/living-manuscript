import { useState, type MouseEvent, type FC } from 'react';
import { Bookmark, X, Trash2, ArrowUpRight, Copy, Check } from 'lucide-react';

export interface SavedSpecimen {
  id: string;
  seed: string;
  sectors: number;
  motifs: string[];
  timestamp: number;
}

interface SpecimenPanelProps {
  isOpen: boolean;
  onClose: () => void;
  specimens: SavedSpecimen[];
  onLoadSpecimen: (specimen: SavedSpecimen) => void;
  onDeleteSpecimen: (id: string) => void;
}

export const SpecimenPanel: FC<SpecimenPanelProps> = ({
  isOpen,
  onClose,
  specimens,
  onLoadSpecimen,
  onDeleteSpecimen,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySeed = (specimen: SavedSpecimen, e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(specimen.seed);
    setCopiedId(specimen.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(38, 37, 31, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="manuscript-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem 1.5rem',
          borderRadius: 0,
          borderLeft: '1px solid var(--vellum-border-strong)',
          backgroundColor: '#FAF5ED',
          overflowY: 'auto',
          boxShadow: '-8px 0 32px rgba(38, 37, 31, 0.15)',
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
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bookmark size={18} color="var(--brass)" />
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  letterSpacing: '0.08em',
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Saved Specimens
              </h2>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--ink-muted)',
                }}
              >
                {specimens.length} Archival Studies Bookmarked
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="desk-btn desk-btn-icon"
            aria-label="Close specimens"
          >
            <X size={16} />
          </button>
        </div>

        {/* Specimen List */}
        {specimens.length === 0 ? (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--ink-muted)',
              fontStyle: 'italic',
              fontSize: '0.92rem',
            }}
          >
            <p>No specimens recorded yet.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontStyle: 'normal' }}>
              Pause at any point during drawing and press <strong>Keep Specimen</strong> to bookmark the current seed.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {specimens.map((specimen) => (
              <div
                key={specimen.id}
                onClick={() => {
                  onLoadSpecimen(specimen);
                  onClose();
                }}
                className="manuscript-card"
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  border: '1px solid var(--vellum-border)',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'var(--vellum-card)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brass)';
                  e.currentTarget.style.boxShadow = '0 4px 12px var(--brass-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--vellum-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: 'var(--ink)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {specimen.seed}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={(e) => handleCopySeed(specimen, e)}
                      className="desk-btn desk-btn-icon"
                      style={{ padding: '0.25rem', width: '24px', height: '24px' }}
                      title="Copy Seed String"
                    >
                      {copiedId === specimen.id ? (
                        <Check size={12} color="green" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSpecimen(specimen.id);
                      }}
                      className="desk-btn desk-btn-icon"
                      style={{ padding: '0.25rem', width: '24px', height: '24px' }}
                      title="Delete Specimen"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ink-faded)',
                    marginTop: '0.5rem',
                  }}
                >
                  <span>{specimen.sectors}-Fold Symmetry</span>
                  <span>{new Date(specimen.timestamp).toLocaleDateString()}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.3rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {specimen.motifs.map((motif, mIdx) => (
                    <span
                      key={mIdx}
                      style={{
                        fontSize: '0.62rem',
                        fontFamily: 'var(--font-serif)',
                        textTransform: 'capitalize',
                        padding: '0.1rem 0.4rem',
                        background: 'rgba(155, 144, 124, 0.15)',
                        borderRadius: '2px',
                        color: 'var(--ink-faded)',
                      }}
                    >
                      Tier {mIdx + 1}: {motif}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    marginTop: '0.6rem',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-display)',
                    color: 'var(--brass-hover)',
                  }}
                >
                  <span>Revisit Composition</span>
                  <ArrowUpRight size={12} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
