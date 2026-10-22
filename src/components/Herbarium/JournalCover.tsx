import { useState, type FC, type MouseEvent } from 'react';
import { BookOpen, X, Edit3, Check } from 'lucide-react';
import type { HerbariumJournalData } from '../../types/herbarium';

interface JournalCoverProps {
  journal: HerbariumJournalData;
  onOpenJournal: () => void;
  onClose: () => void;
  onUpdateOwnerName: (newName: string) => void;
}

export const JournalCover: FC<JournalCoverProps> = ({
  journal,
  onOpenJournal,
  onClose,
  onUpdateOwnerName,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [ownerInput, setOwnerInput] = useState(journal.ownerName);

  const handleSaveName = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (ownerInput.trim()) {
      onUpdateOwnerName(ownerInput.trim());
    }
    setIsEditingName(false);
  };

  const startedYear = new Date(journal.startedDate).getFullYear();
  const totalSpecimens = journal.specimens.length;

  return (
    <div className="herbarium-cover-wrapper" onClick={(e) => e.stopPropagation()}>
      {/* Brass Corner Protectors */}
      <div className="brass-corner brass-corner-tl" />
      <div className="brass-corner brass-corner-tr" />
      <div className="brass-corner brass-corner-bl" />
      <div className="brass-corner brass-corner-br" />

      {/* Leather Spine Ridge */}
      <div className="herbarium-cover-spine-edge" />

      {/* Top Close Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
        <button
          onClick={onClose}
          className="desk-btn desk-btn-icon"
          style={{
            background: 'rgba(250, 245, 237, 0.1)',
            borderColor: 'rgba(198, 166, 100, 0.4)',
            color: 'var(--brass)',
          }}
          title="Close Journal (Esc)"
          aria-label="Close Journal"
        >
          <X size={14} />
        </button>
      </div>

      {/* Inset Parchment Bookplate */}
      <div className="herbarium-bookplate">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.2em',
            color: 'var(--ink-muted)',
            textTransform: 'uppercase',
          }}
        >
          EX LIBRIS BOTANICIS
        </span>

        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            letterSpacing: '0.12em',
            color: 'var(--ink)',
            margin: '0.4rem 0 0.2rem',
            fontWeight: 500,
          }}
        >
          THE HERBARIUM
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '0.92rem',
            fontStyle: 'italic',
            color: 'var(--ink-faded)',
            margin: 0,
          }}
        >
          A Personal Catalogue of Botanical Forms
        </p>

        <div className="herbarium-gold-rule" />

        {/* Collection Owner Field */}
        <div style={{ margin: '1rem 0 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="text"
                value={ownerInput}
                onChange={(e) => setOwnerInput(e.target.value)}
                autoFocus
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.05rem',
                  fontStyle: 'italic',
                  color: 'var(--ink)',
                  border: '1px solid var(--brass)',
                  background: '#FFF',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '2px',
                  textAlign: 'center',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <button
                onClick={handleSaveName}
                className="desk-btn desk-btn-icon"
                style={{ width: '26px', height: '26px', padding: 0 }}
                title="Save Name"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderBottom: '1px dashed rgba(148, 139, 122, 0.4)',
                paddingBottom: '2px',
              }}
              title="Click to personalize journal owner name"
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  fontStyle: 'italic',
                  color: 'var(--ink)',
                }}
              >
                The Collection of {journal.ownerName}
              </span>
              <Edit3 size={11} color="var(--ink-muted)" />
            </div>
          )}
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--ink-muted)',
            letterSpacing: '0.08em',
          }}
        >
          <span>BEGUN ANNO DOMINI {startedYear}</span>
          <span style={{ margin: '0 0.5rem' }}>·</span>
          <span>{totalSpecimens} PLATES INSCRIBED</span>
        </div>
      </div>

      {/* Bottom Open Action */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', zIndex: 10 }}>
        <button
          onClick={onOpenJournal}
          className="desk-btn desk-btn-primary"
          style={{
            padding: '0.65rem 1.75rem',
            fontSize: '0.82rem',
            letterSpacing: '0.12em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            border: '1px solid var(--brass)',
          }}
        >
          <BookOpen size={15} color="var(--brass)" />
          <span>Open Herbarium</span>
        </button>
      </div>
    </div>
  );
};
