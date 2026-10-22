import { useState, useEffect, type FC, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  Trash2,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import type { HerbariumSpecimen } from '../../types/herbarium';
import { MOTIF_FAMILIES } from '../../types/herbarium';
import { SpecimenThumbnail } from './SpecimenThumbnail';
import { generateMandalaScene } from '../../engine/scene';
import { downloadSVG } from '../../export/svg';
import { downloadHighResPNG } from '../../export/png';

interface SpecimenRecordViewProps {
  specimen: HerbariumSpecimen;
  allSpecimens: HerbariumSpecimen[];
  onRevisitSpecimen: (specimen: HerbariumSpecimen) => void;
  onUpdateSpecimen: (updated: HerbariumSpecimen) => void;
  onDeleteSpecimen: (id: string) => void;
  onReturnToIndex: () => void;
  onClose: () => void;
}

export const SpecimenRecordView: FC<SpecimenRecordViewProps> = ({
  specimen,
  allSpecimens,
  onRevisitSpecimen,
  onUpdateSpecimen,
  onDeleteSpecimen,
  onReturnToIndex,
  onClose,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(specimen.title);
  const [notesInput, setNotesInput] = useState(specimen.notes);
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Sync state if specimen changes
  useEffect(() => {
    setTitleInput(specimen.title);
    setNotesInput(specimen.notes);
    setIsEditingTitle(false);
    setIsConfirmingDelete(false);
  }, [specimen]);

  // Handle Title Save
  const handleSaveTitle = () => {
    if (titleInput.trim() && titleInput !== specimen.title) {
      onUpdateSpecimen({ ...specimen, title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  // Handle Notes Auto-Save
  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotesInput(val);
    onUpdateSpecimen({ ...specimen, notes: val });
    setNotesSavedNotice(true);
    setTimeout(() => setNotesSavedNotice(false), 2000);
  };

  // Find index for Previous / Next specimen navigation
  const currentIndex = allSpecimens.findIndex((s) => s.id === specimen.id);
  const prevSpecimen = currentIndex > 0 ? allSpecimens[currentIndex - 1] : null;
  const nextSpecimen = currentIndex < allSpecimens.length - 1 ? allSpecimens[currentIndex + 1] : null;

  const familyMeta = MOTIF_FAMILIES[specimen.family];
  const dateFormatted = new Date(specimen.timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Direct export helpers
  const handleExportSVG = () => {
    const scene = generateMandalaScene({
      seed: specimen.seed,
      sectors: specimen.sectors,
      preset: specimen.preset,
      detailDensity: specimen.detailDensity,
    });
    downloadSVG(scene, { includeBackground: true, includeGuides: false });
  };

  const handleExportPNG = () => {
    const scene = generateMandalaScene({
      seed: specimen.seed,
      sectors: specimen.sectors,
      preset: specimen.preset,
      detailDensity: specimen.detailDensity,
    });
    downloadHighResPNG(scene, { size: 2400, includeGuides: false });
  };

  return (
    <div className="herbarium-spread" onClick={(e) => e.stopPropagation()}>
      {/* Center Spine Fold */}
      <div className="herbarium-book-spine-crease" />

      {/* ==================================================================
          LEFT PAGE: THE BOTANICAL MANDALA PLATE
          ================================================================== */}
      <div className="herbarium-page herbarium-page-left">
        {/* Header */}
        <div className="herbarium-page-header">
          <button
            onClick={onReturnToIndex}
            className="desk-btn"
            style={{
              padding: '0.15rem 0.5rem',
              fontSize: '0.62rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--ink-faded)',
            }}
          >
            <ArrowLeft size={11} style={{ marginRight: '0.25rem' }} /> Index
          </button>
          <span>TABULA {specimen.specimenNumber.toString().padStart(2, '0')}</span>
          <span style={{ color: familyMeta.color }}>{familyMeta.name.toUpperCase()}</span>
        </div>

        {/* Large Central Plate Illustration */}
        <div className="herbarium-plate-view">
          <div className="herbarium-plate-frame">
            <SpecimenThumbnail specimen={specimen} size={250} />
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontStyle: 'italic',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0 0 0.25rem',
            }}
          >
            {specimen.title}
          </h3>

          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              letterSpacing: '0.12em',
              color: 'var(--ink-muted)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {familyMeta.latinOrder}
          </p>

          <div
            style={{
              marginTop: '1rem',
              padding: '0.45rem 1rem',
              borderTop: '1px solid rgba(148, 139, 122, 0.3)',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.8rem',
              fontStyle: 'italic',
              color: 'var(--ink-faded)',
            }}
          >
            Delineavit ex natura · Symmetria {specimen.sectors}-partita · Modus:{' '}
            {specimen.preset.toUpperCase()}
          </div>
        </div>

        {/* Left Page Footer */}
        <div className="herbarium-page-footer">
          <span>PLATE {specimen.specimenNumber}</span>
          <span>THE HERBARIUM</span>
        </div>
      </div>

      {/* ==================================================================
          RIGHT PAGE: FIELD NOTES & RECORD SPECIFICATIONS
          ================================================================== */}
      <div className="herbarium-page herbarium-page-right">
        {/* Header */}
        <div className="herbarium-page-header">
          <span>SPECIMEN RECORD</span>
          <button
            onClick={onClose}
            className="desk-btn desk-btn-icon"
            style={{ width: '22px', height: '22px', padding: 0 }}
            title="Close Herbarium (Esc)"
          >
            <X size={12} />
          </button>
        </div>

        {/* Top Badges: Discovery Stamp & Order Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div
            className="herbarium-ink-stamp"
            style={{ borderColor: familyMeta.color, color: familyMeta.color }}
          >
            <span>DISCOVERED · {dateFormatted.toUpperCase()}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {specimen.isFavorite && (
              <span className="herbarium-milestone-pill" style={{ color: 'var(--brass)' }}>
                ★ PRESERVED
              </span>
            )}
          </div>
        </div>

        {/* Editable Title Section */}
        <div style={{ marginBottom: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isEditingTitle ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.15rem',
                    fontStyle: 'italic',
                    color: 'var(--ink)',
                    padding: '0.2rem 0.5rem',
                    border: '1px solid var(--brass)',
                    background: '#FFF',
                    borderRadius: '2px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                />
                <button onClick={handleSaveTitle} className="desk-btn desk-btn-icon" title="Save Title">
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
                title="Click to rename specimen"
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    margin: 0,
                  }}
                >
                  {specimen.title}
                </h2>
                <Edit2 size={13} color="var(--ink-muted)" />
              </div>
            )}
          </div>
        </div>

        {/* Technical Generation Specifications Table */}
        <div
          style={{
            background: 'rgba(245, 239, 229, 0.65)',
            border: '1px solid rgba(148, 139, 122, 0.35)',
            borderRadius: '2px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1.15rem',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.12em',
              color: 'var(--ink-muted)',
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
            }}
          >
            MATHEMATICAL SPECIFICATION
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.4rem 0.85rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--ink-faded)',
            }}
          >
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>SEED: </span>
              <strong style={{ color: 'var(--ink)' }}>{specimen.seed}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>SYMMETRY: </span>
              <strong style={{ color: 'var(--ink)' }}>{specimen.sectors}-FOLD</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>STYLE PRESET: </span>
              <strong style={{ color: 'var(--brass-hover)' }}>{specimen.preset.toUpperCase()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>LINE DENSITY: </span>
              <strong style={{ color: 'var(--ink)' }}>{specimen.detailDensity.toFixed(2)}x</strong>
            </div>
          </div>
        </div>

        {/* Naturalist's Personal Field Notes */}
        <div style={{ marginBottom: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.68rem',
                letterSpacing: '0.1em',
                color: 'var(--ink-faded)',
                textTransform: 'uppercase',
              }}
            >
              Naturalist's Field Notes
            </label>
            {notesSavedNotice && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  color: 'var(--brass-hover)',
                }}
              >
                ✓ Saved to Journal
              </span>
            )}
          </div>

          <textarea
            className="herbarium-field-notes-box"
            placeholder="Record personal thoughts, botanical observations, or reasons for preserving this mandala..."
            value={notesInput}
            onChange={handleNotesChange}
          />
        </div>

        {/* Action Toolbar: Revisit, Exports, Delete */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(148, 139, 122, 0.3)',
          }}
        >
          {/* Main Action: Revisit Specimen */}
          <button
            onClick={() => onRevisitSpecimen(specimen)}
            className="desk-btn desk-btn-primary"
            title="Restore this exact composition into the art engine"
          >
            <Compass size={14} color="var(--brass)" />
            <span>Revisit Specimen</span>
          </button>

          {/* Export SVG */}
          <button onClick={handleExportSVG} className="desk-btn" title="Export Vector SVG (.svg)">
            <Download size={13} />
            <span>SVG</span>
          </button>

          {/* Export PNG */}
          <button onClick={handleExportPNG} className="desk-btn" title="Export High-Res PNG (2400px)">
            <Download size={13} />
            <span>PNG</span>
          </button>

          {/* Delete Specimen */}
          {isConfirmingDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
                Remove?
              </span>
              <button
                onClick={() => onDeleteSpecimen(specimen.id)}
                className="desk-btn"
                style={{ color: '#8A2B2B', borderColor: '#8A2B2B' }}
              >
                Yes
              </button>
              <button onClick={() => setIsConfirmingDelete(false)} className="desk-btn">
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="desk-btn desk-btn-icon"
              style={{ marginLeft: 'auto', color: 'var(--ink-muted)' }}
              title="Remove specimen from journal"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Right Page Footer & Pagination */}
        <div className="herbarium-page-footer" style={{ marginTop: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {prevSpecimen ? (
              <button
                onClick={() => onUpdateSpecimen(prevSpecimen)}
                className="desk-btn"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}
                title={`Previous: Tab. ${prevSpecimen.specimenNumber}`}
              >
                <ChevronLeft size={11} /> Tab. {prevSpecimen.specimenNumber}
              </button>
            ) : (
              <span style={{ opacity: 0.4, fontSize: '0.65rem' }}>Beginning of Volume</span>
            )}

            {nextSpecimen && (
              <button
                onClick={() => onUpdateSpecimen(nextSpecimen)}
                className="desk-btn"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}
                title={`Next: Tab. ${nextSpecimen.specimenNumber}`}
              >
                Tab. {nextSpecimen.specimenNumber} <ChevronRight size={11} />
              </button>
            )}
          </div>

          <button
            onClick={onReturnToIndex}
            className="desk-btn"
            style={{
              padding: '0.2rem 0.55rem',
              fontSize: '0.65rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--ink-faded)',
            }}
          >
            Index Catalogus
          </button>
        </div>
      </div>
    </div>
  );
};
