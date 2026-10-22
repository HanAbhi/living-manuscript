import { useState, useEffect, useCallback, type FC } from 'react';
import type { HerbariumJournalData, HerbariumSpecimen } from '../../types/herbarium';
import { JournalCover } from './JournalCover';
import { JournalIndexSpread } from './JournalIndexSpread';
import { SpecimenRecordView } from './SpecimenRecordView';
import './herbarium.css';

interface HerbariumModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: HerbariumJournalData;
  onLoadSpecimen: (specimen: HerbariumSpecimen) => void;
  onUpdateJournal: (updated: HerbariumJournalData) => void;
  initialSpecimenId?: string | null;
}

export const HerbariumModal: FC<HerbariumModalProps> = ({
  isOpen,
  onClose,
  journal,
  onLoadSpecimen,
  onUpdateJournal,
  initialSpecimenId,
}) => {
  const [currentView, setCurrentView] = useState<'cover' | 'index' | 'record'>('index');
  const [activeSpecimen, setActiveSpecimen] = useState<HerbariumSpecimen | null>(null);

  // If opening with a specific specimen requested (e.g. from a save toast), jump directly to that record
  useEffect(() => {
    if (isOpen) {
      const urlView = new URLSearchParams(window.location.search).get('view');
      if (urlView === 'cover') {
        setCurrentView('cover');
        return;
      }
      if (urlView === 'record' && journal.specimens.length > 0) {
        setActiveSpecimen(journal.specimens[0]);
        setCurrentView('record');
        return;
      }
      if (urlView === 'index') {
        setCurrentView('index');
        return;
      }

      if (initialSpecimenId) {
        const found = journal.specimens.find((s) => s.id === initialSpecimenId);
        if (found) {
          setActiveSpecimen(found);
          setCurrentView('record');
          return;
        }
      }
      // If collection is empty, show the beautiful book cover first
      if (journal.specimens.length === 0) {
        setCurrentView('cover');
      } else {
        setCurrentView('index');
      }
    }
  }, [isOpen, initialSpecimenId, journal.specimens]);

  // Handle Escape key to step backwards or close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (currentView === 'record') {
          setCurrentView('index');
        } else if (currentView === 'index' && journal.specimens.length === 0) {
          setCurrentView('cover');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentView, journal.specimens.length, onClose]);

  // Update Owner Name
  const handleUpdateOwnerName = useCallback(
    (newName: string) => {
      onUpdateJournal({
        ...journal,
        ownerName: newName,
      });
    },
    [journal, onUpdateJournal]
  );

  // Update Single Specimen (title, notes, favorite)
  const handleUpdateSpecimen = useCallback(
    (updated: HerbariumSpecimen) => {
      const updatedList = journal.specimens.map((s) => (s.id === updated.id ? updated : s));
      onUpdateJournal({
        ...journal,
        specimens: updatedList,
      });
      setActiveSpecimen(updated);
    },
    [journal, onUpdateJournal]
  );

  // Delete Specimen
  const handleDeleteSpecimen = useCallback(
    (id: string) => {
      const remaining = journal.specimens.filter((s) => s.id !== id);
      onUpdateJournal({
        ...journal,
        specimens: remaining,
      });
      setCurrentView('index');
      setActiveSpecimen(null);
    },
    [journal, onUpdateJournal]
  );

  // Revisit Specimen into Art Engine
  const handleRevisit = useCallback(
    (specimen: HerbariumSpecimen) => {
      onLoadSpecimen(specimen);
      onClose();
    },
    [onLoadSpecimen, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="herbarium-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="The Herbarium Journal">
      <div className="herbarium-book-container" onClick={(e) => e.stopPropagation()}>
        {currentView === 'cover' && (
          <JournalCover
            journal={journal}
            onOpenJournal={() => setCurrentView('index')}
            onClose={onClose}
            onUpdateOwnerName={handleUpdateOwnerName}
          />
        )}

        {currentView === 'index' && (
          <JournalIndexSpread
            specimens={journal.specimens}
            onSelectSpecimen={(specimen) => {
              setActiveSpecimen(specimen);
              setCurrentView('record');
            }}
            onClose={onClose}
            onReturnToCover={() => setCurrentView('cover')}
          />
        )}

        {currentView === 'record' && activeSpecimen && (
          <SpecimenRecordView
            specimen={activeSpecimen}
            allSpecimens={journal.specimens}
            onRevisitSpecimen={handleRevisit}
            onUpdateSpecimen={handleUpdateSpecimen}
            onDeleteSpecimen={handleDeleteSpecimen}
            onReturnToIndex={() => setCurrentView('index')}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};
