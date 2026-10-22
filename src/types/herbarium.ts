/**
 * The Herbarium — Data Model, Classification & Archival Persistence.
 * Preserves complete immutable generation parameters alongside editable naturalist field notes.
 */

import type { CompositionPreset } from '../engine/scene';

export type MotifFamily =
  | 'Rosarium'
  | 'Viridarium'
  | 'Spiralia'
  | 'Fossilarium'
  | 'Miscellanea';

export interface HerbariumSpecimen {
  id: string; // Unique study identifier
  specimenNumber: number; // Sequential plate number (Tab. I, Tab. II...)
  seed: string; // Deterministic PRNG seed
  sectors: number; // Fold symmetry count (8, 12, 16, 24)
  preset: CompositionPreset; // 'sparse' | 'ornate' | 'wild'
  detailDensity: number; // 0.6 to 1.4
  motifs: string[]; // Botanical motif types generated
  family: MotifFamily; // Curated collectible botanical order
  title: string; // Botanical name or personalized user title
  notes: string; // Personal naturalist field notes and observations
  timestamp: number; // Creation timestamp
  isFavorite?: boolean; // Starred study
}

export interface HerbariumJournalData {
  ownerName: string;
  startedDate: number;
  specimens: HerbariumSpecimen[];
}

export interface MotifFamilyMeta {
  name: MotifFamily;
  latinOrder: string;
  description: string;
  color: string;
}

export const MOTIF_FAMILIES: Record<MotifFamily, MotifFamilyMeta> = {
  Rosarium: {
    name: 'Rosarium',
    latinOrder: 'Ordo Rosarum & Florae',
    description: 'Lotus petals, concentric calyx rings, and radial rosettes',
    color: '#8A5A44',
  },
  Viridarium: {
    name: 'Viridarium',
    latinOrder: 'Ordo Viridarium',
    description: 'Fern fronds, pinnule branching, and verdant foliage',
    color: '#435848',
  },
  Spiralia: {
    name: 'Spiralia',
    latinOrder: 'Ordo Spiralia',
    description: 'Acanthus scrolls, curling tendrils, and organic spirals',
    color: '#655743',
  },
  Fossilarium: {
    name: 'Fossilarium',
    latinOrder: 'Ordo Fossilarium',
    description: 'Seed pods, calyx urns, and calcified botanical vessels',
    color: '#6F5C3E',
  },
  Miscellanea: {
    name: 'Miscellanea',
    latinOrder: 'Ordo Miscellanea',
    description: 'Hybrid compositions, ornate friezes, and botanical studies',
    color: '#5C544B',
  },
};

/**
 * Classifies a specimen into a collectible botanical family based on its motifs.
 */
export function determineMotifFamily(motifs: string[] = []): MotifFamily {
  const hasLotus = motifs.includes('lotus');
  const hasFern = motifs.includes('fern');
  const hasTendril = motifs.includes('tendril');
  const hasSeedPod = motifs.includes('seedPod');

  if (hasLotus && !hasTendril) return 'Rosarium';
  if (hasFern && !hasSeedPod) return 'Viridarium';
  if (hasTendril) return 'Spiralia';
  if (hasSeedPod) return 'Fossilarium';
  if (hasLotus) return 'Rosarium';
  if (hasFern) return 'Viridarium';
  return 'Miscellanea';
}

/**
 * Generates an authentic Linnaean binomial title for newly catalogued specimens.
 */
export function generateBotanicalTitle(
  seed: string,
  family: MotifFamily,
  specimenNumber: number
): string {
  // Extract seed name prefix if present
  const prefix = seed.split('-')[0] || 'BOTANICA';
  const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();

  const epithets: Record<MotifFamily, string[]> = {
    Rosarium: ['Stellata', 'Floribunda', 'Magnifica', 'Radicans', 'Nobilis'],
    Viridarium: ['Filicata', 'Silvatica', 'Frondosa', 'Palustris', 'Bipinnata'],
    Spiralia: ['Volubilis', 'Circinata', 'Spirata', 'Acanthoides', 'Elegans'],
    Fossilarium: ['Capsularis', 'Fructifera', 'Coronata', 'Antiqua', 'Petrosa'],
    Miscellanea: ['Variabilis', 'Mirabilis', 'Curiosa', 'Hybrida', 'Composita'],
  };

  const pool = epithets[family] || epithets.Miscellanea;
  const index = Math.abs(seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % pool.length;
  const epithet = pool[index];

  return `${capitalized} ${epithet} No. ${specimenNumber}`;
}

export const STORAGE_KEY_JOURNAL = 'living_manuscript_herbarium';
export const STORAGE_KEY_LEGACY = 'living_manuscript_specimens';

/**
 * Safely loads the Herbarium journal, seamlessly migrating legacy saved specimens.
 */
export function loadHerbariumJournal(): HerbariumJournalData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_JOURNAL);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.specimens)) {
        return {
          ownerName: parsed.ownerName || 'Resident Naturalist',
          startedDate: parsed.startedDate || Date.now(),
          specimens: parsed.specimens.map((s: Partial<HerbariumSpecimen>, idx: number) => ({
            id: s.id || `specimen-${Date.now()}-${idx}`,
            specimenNumber: s.specimenNumber || idx + 1,
            seed: s.seed || 'SPECIMEN-0001',
            sectors: s.sectors || 16,
            preset: s.preset || 'ornate',
            detailDensity: typeof s.detailDensity === 'number' ? s.detailDensity : 1.0,
            motifs: Array.isArray(s.motifs) ? s.motifs : ['lotus'],
            family: s.family || determineMotifFamily(s.motifs),
            title: s.title || `Botanica Specimen ${idx + 1}`,
            notes: s.notes || '',
            timestamp: s.timestamp || Date.now(),
            isFavorite: Boolean(s.isFavorite),
          })),
        };
      }
    }

    // Migrate from legacy specimens if exists
    const legacySaved = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacySaved) {
      const legacyList = JSON.parse(legacySaved);
      if (Array.isArray(legacyList) && legacyList.length > 0) {
        const migrated: HerbariumSpecimen[] = legacyList.map((item, idx) => {
          const family = determineMotifFamily(item.motifs || []);
          return {
            id: item.id || `legacy-${item.seed}-${idx}`,
            specimenNumber: idx + 1,
            seed: item.seed || 'SPECIMEN-0001',
            sectors: item.sectors || 16,
            preset: 'ornate',
            detailDensity: 1.0,
            motifs: item.motifs || ['lotus'],
            family,
            title: generateBotanicalTitle(item.seed || 'BOTANICA', family, idx + 1),
            notes: 'Historical study recovered from early archival manuscripts.',
            timestamp: item.timestamp || Date.now(),
            isFavorite: false,
          };
        });

        const initialJournal: HerbariumJournalData = {
          ownerName: 'Resident Naturalist',
          startedDate: legacyList[0]?.timestamp || Date.now(),
          specimens: migrated,
        };

        saveHerbariumJournal(initialJournal);
        return initialJournal;
      }
    }
  } catch (err) {
    console.warn('Could not load Herbarium journal, initializing fresh collection:', err);
  }

  // Initial founding studies for a new naturalist collection
  const foundingStudies: HerbariumSpecimen[] = [
    {
      id: 'founding-study-01',
      specimenNumber: 1,
      seed: 'SPECIMEN-0001',
      sectors: 16,
      preset: 'ornate',
      detailDensity: 1.0,
      motifs: ['lotus', 'seedPod'],
      family: 'Rosarium',
      title: 'Nymphaea Stellata No. 1',
      notes: 'Founding mandala study inscribed on warm vellum. Symmetrical lotus calyx with directional burin hatching.',
      timestamp: Date.now() - 86400000 * 3,
      isFavorite: true,
    },
    {
      id: 'founding-study-02',
      specimenNumber: 2,
      seed: 'PAPAVER-4180',
      sectors: 12,
      preset: 'sparse',
      detailDensity: 0.9,
      motifs: ['seedPod', 'fern'],
      family: 'Fossilarium',
      title: 'Papaver Capsularis No. 2',
      notes: 'Delicate calcified seed vessels and fern pinnae preserved with generous margin.',
      timestamp: Date.now() - 86400000 * 1,
      isFavorite: false,
    },
  ];

  return {
    ownerName: 'Resident Naturalist',
    startedDate: Date.now() - 86400000 * 7,
    specimens: foundingStudies,
  };
}

/**
 * Safely writes Herbarium journal to localStorage with quota protection.
 */
export function saveHerbariumJournal(journal: HerbariumJournalData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(journal));
    // Also keep legacy key synced for backward compatibility
    const legacyCompact = journal.specimens.map((s) => ({
      id: s.id,
      seed: s.seed,
      sectors: s.sectors,
      motifs: s.motifs,
      timestamp: s.timestamp,
    }));
    localStorage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(legacyCompact));
    return true;
  } catch (err) {
    console.error('LocalStorage write failed in Herbarium:', err);
    return false;
  }
}
