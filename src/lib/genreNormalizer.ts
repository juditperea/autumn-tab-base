/**
 * Genre Normalizer
 * 
 * Cleans, deduplicates, filters and translates raw book genres
 * from Google Books (categories) and OpenLibrary (subjects).
 * 
 * Designed to run in the frontend at display time without modifying DB schema.
 */

// ── Synonym map (normalized lowercase key → display label in Spanish) ──
// Extend this map as needed to collapse duplicates.
export const GENRE_SYNONYMS: Record<string, string> = {
  // Ficción juvenil
  "juvenile fiction": "ficción juvenil",
  "young adult fiction": "ficción juvenil",
  "ya fiction": "ficción juvenil",
  "children's fiction": "ficción juvenil",
  "ficción juvenil": "ficción juvenil",

  // Ficción general
  "fiction": "ficción",
  "fiction - general": "ficción",
  "ficción": "ficción",
  "modern fiction": "ficción",
  "adult fiction": "ficción",
  "literary fiction": "ficción literaria",
  "ficción literaria": "ficción literaria",

  // Relatos
  "short stories": "relatos",
  "short stories (single author)": "relatos",
  "cuentos": "relatos",
  "relatos": "relatos",

  // No ficción
  "nonfiction": "no ficción",
  "non-fiction": "no ficción",
  "no ficción": "no ficción",

  // Fantasía
  "fantasy": "fantasía",
  "fantasy fiction": "fantasía",
  "fantasía": "fantasía",
  "epic fantasy": "fantasía épica",

  // Ciencia ficción
  "science fiction": "ciencia ficción",
  "sci-fi": "ciencia ficción",
  "ciencia ficción": "ciencia ficción",

  // Romance
  "romance": "romance",
  "romance fiction": "romance",
  "love stories": "romance",

  // Misterio / Thriller
  "mystery": "misterio",
  "mystery fiction": "misterio",
  "misterio": "misterio",
  "thriller": "thriller",
  "suspense": "thriller",
  "thrillers": "thriller",

  // Terror
  "horror": "terror",
  "horror fiction": "terror",
  "terror": "terror",

  // Histórica
  "historical fiction": "ficción histórica",
  "ficción histórica": "ficción histórica",

  // Aventura
  "adventure": "aventura",
  "adventure fiction": "aventura",
  "aventura": "aventura",

  // Biografía / Memorias
  "biography": "biografía",
  "biography & autobiography": "biografía",
  "biografía": "biografía",
  "memoir": "memorias",
  "memorias": "memorias",

  // Autoayuda
  "self-help": "autoayuda",
  "autoayuda": "autoayuda",

  // Historia
  "history": "historia",
  "historia": "historia",

  // Ciencia
  "science": "ciencia",
  "ciencia": "ciencia",

  // Filosofía
  "philosophy": "filosofía",
  "filosofía": "filosofía",

  // Poesía
  "poetry": "poesía",
  "poesía": "poesía",

  // Clásicos
  "classics": "clásicos",
  "clásicos": "clásicos",

  // Crimen
  "crime": "crimen",
  "crime fiction": "crimen",
  "crimen": "crimen",

  // Distopía
  "dystopian": "distopía",
  "dystopian fiction": "distopía",
  "distopía": "distopía",

  // Realismo mágico
  "magical realism": "realismo mágico",
  "realismo mágico": "realismo mágico",

  // Humor
  "humor": "humor",
  "comedy": "humor",

  // Drama
  "drama": "drama",

  // Política
  "political fiction": "ficción política",
  "politics": "política",

  // Religión
  "religion": "religión",
  "spirituality": "espiritualidad",

  // Psicología
  "psychology": "psicología",

  // Negocios
  "business": "negocios",
  "business & economics": "negocios",

  // Cocina
  "cooking": "cocina",

  // Arte
  "art": "arte",

  // Viajes
  "travel": "viajes",

  // Educación
  "education": "educación",

  // Manga/Comics
  "comics & graphic novels": "cómics",
  "manga": "manga",
  "graphic novels": "novela gráfica",
};

// ── Stoplist: exact matches after normalization ──
const STOPLIST_EXACT = new Set([
  "general",
  "fiction",
  "nonfiction",
  "literature",
  "books",
  "book",
  "adult fiction",
  "juvenile nonfiction",
  "juvenile",
  "accessible book",
  "protected daisy",
  "in library",
  "lending library",
  "internet archive wishlist",
  "large type books",
  "reading level",
]);

// ── Stoplist: if normalized genre contains any of these, discard ──
const STOPLIST_CONTAINS = [
  "criticism",
  "history and criticism",
  "reference",
  "bibliography",
  "periodicals",
  "textbooks",
  "examinations",
  "study and teaching",
  "problems, exercises",
];

/**
 * Clean a single raw genre string:
 * - trim, lowercase
 * - remove language prefixes (spanish:, english:, es:, en:)
 * - collapse whitespace
 * - remove trailing punctuation
 * - normalize separators
 */
function cleanGenre(raw: string): string {
  let g = raw.trim().toLowerCase();

  // Remove language prefixes
  g = g.replace(/^(spanish|english|es|en)\s*:\s*/i, "");

  // Collapse whitespace
  g = g.replace(/\s+/g, " ");

  // Normalize separators to " - "
  g = g.replace(/\s*[/—:]\s*/g, " - ");

  // Remove trailing punctuation
  g = g.replace(/[.,;:!?]+$/, "");

  return g.trim();
}

/**
 * Check if a genre should be discarded.
 */
function isStopGenre(normalized: string): boolean {
  if (STOPLIST_EXACT.has(normalized)) return true;
  return STOPLIST_CONTAINS.some((stop) => normalized.includes(stop));
}

/**
 * Apply synonym mapping. Returns the Spanish display label if found,
 * otherwise capitalizes the first letter of the cleaned genre.
 */
function applySynonym(cleaned: string): string {
  if (GENRE_SYNONYMS[cleaned]) {
    return GENRE_SYNONYMS[cleaned];
  }

  // Try matching the part before " - " separator
  const dashIdx = cleaned.indexOf(" - ");
  if (dashIdx > 0) {
    const prefix = cleaned.substring(0, dashIdx).trim();
    if (GENRE_SYNONYMS[prefix]) {
      return GENRE_SYNONYMS[prefix];
    }
  }

  // Capitalize first letter as fallback display
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Normalize an array of raw genres from books.genres.
 * Returns deduplicated, filtered, synonym-collapsed labels in Spanish.
 */
export function normalizeGenres(rawGenres: string[]): string[] {
  if (!rawGenres || rawGenres.length === 0) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of rawGenres) {
    const cleaned = cleanGenre(raw);
    if (!cleaned) continue;
    if (isStopGenre(cleaned)) continue;

    const label = applySynonym(cleaned);
    const labelLower = label.toLowerCase();

    // Also check if the resolved label is in stoplist
    if (isStopGenre(labelLower)) continue;

    if (!seen.has(labelLower)) {
      seen.add(labelLower);
      result.push(label);
    }
  }

  return result;
}

/**
 * Pick the single "primary" genre for a book.
 * Takes raw genres, normalizes, and returns the first valid one.
 * Returns "Otros" if none survive filtering.
 */
export function getPrimaryGenre(rawGenres: string[] | null | undefined): string {
  const normalized = normalizeGenres(rawGenres || []);
  return normalized.length > 0 ? normalized[0] : "Otros";
}
