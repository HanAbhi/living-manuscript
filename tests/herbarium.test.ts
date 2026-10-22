import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  determineMotifFamily,
  generateBotanicalTitle,
  loadHerbariumJournal,
  saveHerbariumJournal,
  STORAGE_KEY_JOURNAL,
  STORAGE_KEY_LEGACY,
  type HerbariumSpecimen,
} from '../src/types/herbarium';

// Mock localStorage for node test environment
const mockStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => mockStore.get(key) ?? null,
  setItem: (key: string, val: string) => mockStore.set(key, String(val)),
  removeItem: (key: string) => mockStore.delete(key),
  clear: () => mockStore.clear(),
};

describe('The Herbarium — Botanical Field Journal & Persistence', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      (globalThis as unknown as { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;
    }
  });

  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  describe('Motif Family Classification', () => {
    it('classifies lotus compositions into Rosarium order', () => {
      expect(determineMotifFamily(['lotus', 'fern'])).toBe('Rosarium');
      expect(determineMotifFamily(['lotus'])).toBe('Rosarium');
    });

    it('classifies foliage compositions without pods into Viridarium order', () => {
      expect(determineMotifFamily(['fern'])).toBe('Viridarium');
    });

    it('classifies curling tendrils into Spiralia order', () => {
      expect(determineMotifFamily(['tendril', 'lotus'])).toBe('Spiralia');
      expect(determineMotifFamily(['tendril'])).toBe('Spiralia');
    });

    it('classifies seed pods into Fossilarium order', () => {
      expect(determineMotifFamily(['seedPod', 'fern'])).toBe('Fossilarium');
    });

    it('classifies unknown or hybrid compositions into Miscellanea order', () => {
      expect(determineMotifFamily([])).toBe('Miscellanea');
      expect(determineMotifFamily(['paisley'])).toBe('Miscellanea');
    });
  });

  describe('Linnaean Botanical Title Generation', () => {
    it('produces structured botanical names with specimen numbering', () => {
      const title = generateBotanicalTitle('PAPAVER-7421', 'Rosarium', 4);
      expect(title).toMatch(/^Papaver \w+ No\. 4$/);
    });

    it('is deterministic for identical seed and family', () => {
      const t1 = generateBotanicalTitle('LOTUS-1000', 'Rosarium', 1);
      const t2 = generateBotanicalTitle('LOTUS-1000', 'Rosarium', 1);
      expect(t1).toBe(t2);
    });
  });

  describe('Storage & Migration Guarantees', () => {
    it('seamlessly migrates legacy stored specimens with default generation parameters', () => {
      const legacyData = [
        {
          id: 'legacy-1',
          seed: 'LOTUS-5555',
          sectors: 12,
          motifs: ['lotus'],
          timestamp: 1700000000000,
        },
      ];
      globalThis.localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(legacyData));

      const journal = loadHerbariumJournal();
      expect(journal.specimens.length).toBe(1);
      const migrated = journal.specimens[0];
      expect(migrated.seed).toBe('LOTUS-5555');
      expect(migrated.sectors).toBe(12);
      expect(migrated.preset).toBe('ornate'); // Guaranteed preset
      expect(migrated.detailDensity).toBe(1.0); // Guaranteed detail density
      expect(migrated.family).toBe('Rosarium');
      expect(migrated.specimenNumber).toBe(1);
    });

    it('persists and reloads rich Herbarium specimens with custom field notes', () => {
      const specimen: HerbariumSpecimen = {
        id: 'test-herb-01',
        specimenNumber: 1,
        seed: 'ACANTHUS-8888',
        sectors: 24,
        preset: 'wild',
        detailDensity: 1.25,
        motifs: ['tendril', 'lotus'],
        family: 'Spiralia',
        title: 'Acanthus Volubilis Study',
        notes: 'Curling tendrils observed at dusk.',
        timestamp: Date.now(),
        isFavorite: true,
      };

      const success = saveHerbariumJournal({
        ownerName: 'Naturalist Linnaeus',
        startedDate: 1700000000000,
        specimens: [specimen],
      });
      expect(success).toBe(true);

      const loaded = loadHerbariumJournal();
      expect(loaded.ownerName).toBe('Naturalist Linnaeus');
      expect(loaded.specimens.length).toBe(1);
      const loadedSpecimen = loaded.specimens[0];
      expect(loadedSpecimen.id).toBe('test-herb-01');
      expect(loadedSpecimen.preset).toBe('wild');
      expect(loadedSpecimen.detailDensity).toBe(1.25);
      expect(loadedSpecimen.notes).toBe('Curling tendrils observed at dusk.');
      expect(loadedSpecimen.isFavorite).toBe(true);
    });
  });
});
