import { useState, useMemo, type FC } from 'react';
import { Search, ChevronLeft, ChevronRight, Bookmark, Sparkles, X } from 'lucide-react';
import type { HerbariumSpecimen, MotifFamily } from '../../types/herbarium';
import { MOTIF_FAMILIES } from '../../types/herbarium';
import { SpecimenThumbnail } from './SpecimenThumbnail';

interface JournalIndexSpreadProps {
  specimens: HerbariumSpecimen[];
  onSelectSpecimen: (specimen: HerbariumSpecimen) => void;
  onClose: () => void;
  onReturnToCover: () => void;
}

export const JournalIndexSpread: FC<JournalIndexSpreadProps> = ({
  specimens,
  onSelectSpecimen,
  onClose,
  onReturnToCover,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<MotifFamily | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(0);

  // Filtered and searched specimens
  const filteredSpecimens = useMemo(() => {
    return specimens.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.seed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFamily = selectedFamily === 'ALL' || s.family === selectedFamily;
      return matchesSearch && matchesFamily;
    });
  }, [specimens, searchQuery, selectedFamily]);

  // 4 items per two-page spread (2 left page, 2 right page)
  const ITEMS_PER_SPREAD = 4;
  const totalSpreads = Math.max(1, Math.ceil(filteredSpecimens.length / ITEMS_PER_SPREAD));
  const safePage = Math.min(currentPage, totalSpreads - 1);

  const currentItems = useMemo(() => {
    const start = safePage * ITEMS_PER_SPREAD;
    return filteredSpecimens.slice(start, start + ITEMS_PER_SPREAD);
  }, [filteredSpecimens, safePage]);

  const leftPageItems = currentItems.slice(0, 2);
  const rightPageItems = currentItems.slice(2, 4);

  // Milestone stats: distinct families discovered
  const discoveredFamilies = useMemo(() => {
    const set = new Set<MotifFamily>();
    specimens.forEach((s) => set.add(s.family));
    return set;
  }, [specimens]);

  return (
    <div className="herbarium-spread" onClick={(e) => e.stopPropagation()}>
      {/* Spine Crease Shadow */}
      <div className="herbarium-book-spine-crease" />

      {/* ==================================================================
          LEFT FACING PAGE (CATALOGUE & SEARCH & FIRST 2 ENTRIES)
          ================================================================== */}
      <div className="herbarium-page herbarium-page-left">
        {/* Page Running Header */}
        <div className="herbarium-page-header">
          <button
            onClick={onReturnToCover}
            className="desk-btn"
            style={{
              padding: '0.15rem 0.5rem',
              fontSize: '0.62rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--ink-faded)',
            }}
          >
            ← Cover Page
          </button>
          <span>CATALOGUS BOTANICUS</span>
          <span>FOLIO {safePage * 2 + 1}</span>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.15rem' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={13}
              color="var(--ink-muted)"
              style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search catalogue by name, seed or notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              style={{
                width: '100%',
                padding: '0.35rem 0.65rem 0.35rem 1.9rem',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.82rem',
                border: '1px solid rgba(148, 139, 122, 0.4)',
                borderRadius: '2px',
                background: 'rgba(255, 255, 255, 0.7)',
                outline: 'none',
                color: 'var(--ink)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink-muted)',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Motif Family Filter Chips */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setSelectedFamily('ALL');
                setCurrentPage(0);
              }}
              className={`preset-pill ${selectedFamily === 'ALL' ? 'active' : ''}`}
              style={{ fontSize: '0.62rem', padding: '0.12rem 0.45rem' }}
            >
              All Orders ({specimens.length})
            </button>
            {(Object.keys(MOTIF_FAMILIES) as MotifFamily[]).map((fam) => {
              const meta = MOTIF_FAMILIES[fam];
              const count = specimens.filter((s) => s.family === fam).length;
              if (count === 0 && selectedFamily !== fam) return null;
              return (
                <button
                  key={fam}
                  onClick={() => {
                    setSelectedFamily(fam);
                    setCurrentPage(0);
                  }}
                  className={`preset-pill ${selectedFamily === fam ? 'active' : ''}`}
                  style={{
                    fontSize: '0.62rem',
                    padding: '0.12rem 0.45rem',
                    color: selectedFamily === fam ? 'var(--vellum)' : meta.color,
                  }}
                >
                  {fam} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Left Page Specimen List */}
        <div className="herbarium-specimen-grid">
          {leftPageItems.length > 0 ? (
            leftPageItems.map((specimen) => (
              <SpecimenCard
                key={specimen.id}
                specimen={specimen}
                onClick={() => onSelectSpecimen(specimen)}
              />
            ))
          ) : (
            <EmptyCatalogueState onReturnToCover={onReturnToCover} />
          )}
        </div>

        {/* Left Page Footer */}
        <div className="herbarium-page-footer">
          <span>{filteredSpecimens.length} STUDIES FOUND</span>
          <span>PAGINA {safePage * 2 + 1}</span>
        </div>
      </div>

      {/* ==================================================================
          RIGHT FACING PAGE (SECOND 2 ENTRIES & MILESTONE SEALS & TURNING)
          ================================================================== */}
      <div className="herbarium-page herbarium-page-right">
        {/* Page Running Header */}
        <div className="herbarium-page-header">
          <span>THE LIVING MANUSCRIPT</span>
          <button
            onClick={onClose}
            className="desk-btn desk-btn-icon"
            style={{ width: '22px', height: '22px', padding: 0 }}
            title="Close Herbarium (Esc)"
          >
            <X size={12} />
          </button>
        </div>

        {/* Right Page Specimen List */}
        <div className="herbarium-specimen-grid">
          {rightPageItems.map((specimen) => (
            <SpecimenCard
              key={specimen.id}
              specimen={specimen}
              onClick={() => onSelectSpecimen(specimen)}
            />
          ))}

          {/* If right page has no items but left page does */}
          {rightPageItems.length === 0 && leftPageItems.length > 0 && (
            <div
              style={{
                border: '1px dashed rgba(148, 139, 122, 0.35)',
                borderRadius: '3px',
                padding: '1.5rem',
                textAlign: 'center',
                margin: 'auto 0',
                color: 'var(--ink-muted)',
              }}
            >
              <Sparkles size={20} color="var(--brass)" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                Inscribe further botanical specimens from the artist desk to populate this folio page.
              </p>
            </div>
          )}
        </div>

        {/* Collection Milestones / Motif Orders Stamp Bar */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(148, 139, 122, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                letterSpacing: '0.1em',
                color: 'var(--ink-muted)',
                textTransform: 'uppercase',
              }}
            >
              ORDERS DISCOVERED: {discoveredFamilies.size} / 5
            </span>
            {specimens.length >= 10 && (
              <span className="herbarium-milestone-pill">
                <Bookmark size={10} /> MASTER BOTANIST
              </span>
            )}
            {specimens.length >= 1 && specimens.length < 10 && (
              <span className="herbarium-milestone-pill">
                <Sparkles size={10} /> FIRST BLOOM
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {(Object.keys(MOTIF_FAMILIES) as MotifFamily[]).map((fam) => {
              const isUnlocked = discoveredFamilies.has(fam);
              return (
                <span
                  key={fam}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: isUnlocked ? MOTIF_FAMILIES[fam].color : 'rgba(148, 139, 122, 0.25)',
                    color: isUnlocked ? MOTIF_FAMILIES[fam].color : 'rgba(148, 139, 122, 0.4)',
                    background: isUnlocked ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                    opacity: isUnlocked ? 1 : 0.45,
                  }}
                >
                  {isUnlocked ? '✦ ' : '◇ '}
                  {fam.toUpperCase()}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right Page Footer & Pagination Controls */}
        <div className="herbarium-page-footer" style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="desk-btn"
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.65rem',
                opacity: safePage === 0 ? 0.35 : 1,
              }}
              title="Previous Folio Spread"
            >
              <ChevronLeft size={12} /> Anterior
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalSpreads - 1, p + 1))}
              disabled={safePage >= totalSpreads - 1}
              className="desk-btn"
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.65rem',
                opacity: safePage >= totalSpreads - 1 ? 0.35 : 1,
              }}
              title="Next Folio Spread"
            >
              Posterior <ChevronRight size={12} />
            </button>
          </div>

          <span>PAGINA {safePage * 2 + 2}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Illustrated Specimen Card inside Index Spread.
 */
const SpecimenCard: FC<{
  specimen: HerbariumSpecimen;
  onClick: () => void;
}> = ({ specimen, onClick }) => {
  const familyMeta = MOTIF_FAMILIES[specimen.family];
  const dateStr = new Date(specimen.timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="herbarium-specimen-card" onClick={onClick}>
      {/* Botanical Mandala Preview */}
      <SpecimenThumbnail specimen={specimen} size={78} />

      {/* Specimen Description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.64rem',
              letterSpacing: '0.12em',
              color: 'var(--brass-hover)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            TAB. {specimen.specimenNumber.toString().padStart(2, '0')}
          </span>

          {/* Collectible Ink Stamp */}
          <span
            className="herbarium-ink-stamp"
            style={{ borderColor: familyMeta.color, color: familyMeta.color }}
          >
            {specimen.family}
          </span>
        </div>

        <h4
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.05rem',
            fontStyle: 'italic',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0.15rem 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {specimen.title}
        </h4>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.64rem',
            color: 'var(--ink-muted)',
            display: 'flex',
            gap: '0.45rem',
            alignItems: 'center',
          }}
        >
          <span>{specimen.seed}</span>
          <span>·</span>
          <span>{specimen.sectors}-FOLD</span>
          <span>·</span>
          <span>{dateStr.toUpperCase()}</span>
        </div>

        {specimen.notes && (
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '0.78rem',
              color: 'var(--ink-faded)',
              margin: '0.35rem 0 0',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            "{specimen.notes}"
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Empty Catalogue State when no specimens exist.
 */
const EmptyCatalogueState: FC<{ onReturnToCover: () => void }> = () => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '2.5rem 1.5rem',
        margin: 'auto 0',
      }}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          margin: '0 auto 1rem',
          borderRadius: '50%',
          border: '1px dashed var(--brass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brass)',
        }}
      >
        <Bookmark size={24} />
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          letterSpacing: '0.08em',
          color: 'var(--ink)',
          marginBottom: '0.4rem',
        }}
      >
        Folio Tabula Vacua
      </h3>

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '0.88rem',
          fontStyle: 'italic',
          color: 'var(--ink-faded)',
          maxWidth: '320px',
          margin: '0 auto 1.25rem',
          lineHeight: 1.4,
        }}
      >
        The Herbarium awaits your discoveries. Inscribe your first botanical mandala by pressing 'S'
        or clicking 'Keep' at the artist desk.
      </p>
    </div>
  );
};
