/**
 * Genre Normalizer — Strict Canonical Whitelist
 *
 * Maps raw book genres (from Google Books + OpenLibrary) to a fixed set
 * of canonical Spanish genres. Anything not explicitly mapped is discarded.
 *
 * Key design decisions:
 * - "Ficción juvenil" does NOT exist; instead mapped to ["ficción", "juvenil"] separately.
 * - One raw string can produce 0, 1, or N canonical genres.
 * - No "Otros" bucket — unrecognized genres are silently ignored.
 */

// ── Canonical genres (whitelist) ──
export const CANONICAL_GENRES = [
  "ficción",
  "juvenil",
  "no ficción",
  "misterio y thriller",
  "romance",
  "fantasía",
  "ciencia ficción",
  "terror",
  "histórica",
  "drama",
  "poesía",
  "ensayo",
  "biografía",
  "educación",
  "cómic y novela gráfica",
] as const;

export type CanonicalGenre = (typeof CANONICAL_GENRES)[number];

const CANONICAL_SET = new Set<string>(CANONICAL_GENRES);

// ── Multi-genre mapping: normalized key → canonical genre(s) ──
const GENRE_MAP: Record<string, CanonicalGenre[]> = {
  // Ficción + Juvenil (split)
  "juvenile fiction": ["ficción", "juvenil"],
  "young adult fiction": ["ficción", "juvenil"],
  "ya fiction": ["ficción", "juvenil"],
  "children's fiction": ["ficción", "juvenil"],
  "juvenile nonfiction": ["juvenil", "no ficción"],
  "children's nonfiction": ["juvenil", "no ficción"],

  // Ficción
  "fiction": ["ficción"],
  "fiction - general": ["ficción"],
  "general fiction": ["ficción"],
  "modern fiction": ["ficción"],
  "adult fiction": ["ficción"],
  "literary fiction": ["ficción"],
  "ficción": ["ficción"],

  // No ficción
  "nonfiction": ["no ficción"],
  "non-fiction": ["no ficción"],
  "no ficción": ["no ficción"],

  // Fantasía
  "fantasy": ["fantasía"],
  "fantasy fiction": ["fantasía"],
  "fantasía": ["fantasía"],
  "epic fantasy": ["fantasía"],

  // Ciencia ficción
  "science fiction": ["ciencia ficción"],
  "sci-fi": ["ciencia ficción"],
  "ciencia ficción": ["ciencia ficción"],

  // Romance
  "romance": ["romance"],
  "romance fiction": ["romance"],
  "love stories": ["romance"],

  // Misterio y Thriller
  "mystery": ["misterio y thriller"],
  "mystery fiction": ["misterio y thriller"],
  "misterio": ["misterio y thriller"],
  "thriller": ["misterio y thriller"],
  "suspense": ["misterio y thriller"],
  "thrillers": ["misterio y thriller"],
  "crime": ["misterio y thriller"],
  "crime fiction": ["misterio y thriller"],

  // Terror
  "horror": ["terror"],
  "horror fiction": ["terror"],
  "terror": ["terror"],

  // Histórica
  "historical fiction": ["histórica"],
  "ficción histórica": ["histórica"],
  "historical": ["histórica"],

  // Drama
  "drama": ["drama"],

  // Poesía
  "poetry": ["poesía"],
  "poesía": ["poesía"],

  // Ensayo
  "essay": ["ensayo"],
  "essays": ["ensayo"],
  "ensayo": ["ensayo"],

  // Biografía
  "biography": ["biografía"],
  "biography & autobiography": ["biografía"],
  "biografía": ["biografía"],
  "memoir": ["biografía"],
  "autobiography": ["biografía"],

  // Educación
  "education": ["educación"],
  "educación": ["educación"],

  // Cómic y novela gráfica
  "comics & graphic novels": ["cómic y novela gráfica"],
  "manga": ["cómic y novela gráfica"],
  "graphic novels": ["cómic y novela gráfica"],
  "comic books": ["cómic y novela gráfica"],
  "cómics": ["cómic y novela gráfica"],
};

// ── Stoplist: discard before attempting mapping ──
const STOPLIST_CONTAINS = [
  "criticism",
  "reference",
  "history and criticism",
  "bibliography",
  "periodicals",
  "textbooks",
  "examinations",
  "study and teaching",
  "problems, exercises",
  "families",
  "anarchists",
  "literary",
  "accessible book",
  "protected daisy",
  "in library",
  "lending library",
  "internet archive",
  "large type books",
  "reading level",
  "short stories",
  "single author",
  "classics",
];

/**
 * Clean a single raw genre string.
 */
function cleanGenre(raw: string): string {
  let g = raw.trim().toLowerCase();
  g = g.replace(/^(spanish|english|es|en)\s*:\s*/i, "");
  g = g.replace(/\s+/g, " ");
  g = g.replace(/\s*[/—]\s*/g, " - ");
  g = g.replace(/[.,;:!?]+$/, "");
  return g.trim();
}

/**
 * Check if a cleaned genre should be discarded.
 */
function isStopGenre(cleaned: string): boolean {
  return STOPLIST_CONTAINS.some((stop) => cleaned.includes(stop));
}

/**
 * Map a single raw genre string to 0–N canonical genres.
 */
function mapSingleGenre(cleaned: string): CanonicalGenre[] {
  // Direct map lookup
  if (GENRE_MAP[cleaned]) return GENRE_MAP[cleaned];

  // Try prefix before " - "
  const dashIdx = cleaned.indexOf(" - ");
  if (dashIdx > 0) {
    const prefix = cleaned.substring(0, dashIdx).trim();
    if (GENRE_MAP[prefix]) return GENRE_MAP[prefix];
  }

  // If the cleaned string itself is a canonical genre, accept it
  if (CANONICAL_SET.has(cleaned)) return [cleaned as CanonicalGenre];

  // Not recognized → discard
  return [];
}

/**
 * Map an array of raw genres to deduplicated canonical genres.
 * Returns only genres from the strict whitelist.
 */
export function mapToCanonicalGenres(rawGenres: string[]): CanonicalGenre[] {
  if (!rawGenres || rawGenres.length === 0) return [];

  const seen = new Set<string>();
  const result: CanonicalGenre[] = [];

  for (const raw of rawGenres) {
    const cleaned = cleanGenre(raw);
    if (!cleaned) continue;
    if (isStopGenre(cleaned)) continue;

    const mapped = mapSingleGenre(cleaned);
    for (const genre of mapped) {
      if (!seen.has(genre)) {
        seen.add(genre);
        result.push(genre);
      }
    }
  }

  return result;
}

/**
 * Pick a single primary genre for display.
 * Returns null if no canonical genre matches.
 */
export function getPrimaryGenre(rawGenres: string[] | null | undefined): string | null {
  const canonical = mapToCanonicalGenres(rawGenres || []);
  return canonical.length > 0 ? canonical[0] : null;
}

// ── Legacy exports for backward compatibility ──
export const normalizeGenres = mapToCanonicalGenres;
