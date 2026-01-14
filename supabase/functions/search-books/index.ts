import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookResult {
  title: string;
  authors: string[];
  description: string | null;
  cover_url: string | null;
  isbn10: string | null;
  isbn13: string | null;
  genres: string[];
  language: string | null;
  page_count: number | null;
  published_year: number | null;
  source: string;
  relevance_score?: number;
  popularity_score?: number;
  found_in_both?: boolean;
  // External ratings data (for display orientation, not integration)
  external_rating?: number | null;
  external_ratings_count?: number | null;
  // Original values before translation
  original_title?: string;
  original_description?: string;
  translated?: boolean;
}

interface SearchParams {
  query?: string;
  isbn?: string;
  author?: string;
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  language?: string;
  userLanguage?: string;
}

// ============================================
// SPANISH EDITIONS FILTER - Validate by metadata AND content
// ============================================

// Normalize language codes for comparison
function normalizeLanguageCode(lang: string | null): string | null {
  if (!lang) return null;
  
  const normalizedLang: Record<string, string> = {
    "spa": "es", "spanish": "es", "español": "es",
    "eng": "en", "english": "en",
    "fre": "fr", "french": "fr", "fra": "fr", "français": "fr",
    "ger": "de", "german": "de", "deu": "de", "deutsch": "de",
    "por": "pt", "portuguese": "pt", "português": "pt",
    "ita": "it", "italian": "it", "italiano": "it",
    "cat": "ca", "catalan": "ca", "català": "ca",
    "rus": "ru", "russian": "ru",
    "jpn": "ja", "japanese": "ja",
    "zho": "zh", "chinese": "zh", "chi": "zh"
  };
  
  const lowerLang = lang.toLowerCase();
  
  // Try 3-letter code first
  if (normalizedLang[lowerLang.substring(0, 3)]) {
    return normalizedLang[lowerLang.substring(0, 3)];
  }
  // Try full word
  if (normalizedLang[lowerLang]) {
    return normalizedLang[lowerLang];
  }
  // Fall back to first 2 chars
  return lowerLang.substring(0, 2);
}

// Common Spanish words to detect Spanish content
const SPANISH_INDICATORS = new Set([
  "el", "la", "los", "las", "de", "del", "en", "con", "por", "para", "que", "una", "uno",
  "es", "son", "está", "están", "ha", "han", "ser", "como", "más", "pero", "su", "sus",
  "le", "les", "se", "al", "lo", "ya", "sin", "sobre", "entre", "hasta", "desde",
  "muy", "también", "este", "esta", "estos", "estas", "ese", "esa", "aquel", "aquella",
  "cuando", "donde", "quien", "cual", "cuyo", "todo", "toda", "todos", "todas",
  "otro", "otra", "otros", "otras", "mismo", "misma", "cada", "algún", "ningún",
  "historia", "vida", "mundo", "amor", "muerte", "guerra", "hombre", "mujer", "tiempo",
  "años", "día", "noche", "casa", "ciudad", "país", "siglo", "parte", "libro"
]);

// Common English words to detect English content
const ENGLISH_INDICATORS = new Set([
  "the", "a", "an", "of", "in", "to", "for", "with", "on", "at", "by", "from",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might",
  "this", "that", "these", "those", "it", "its", "they", "them", "their",
  "he", "she", "him", "her", "his", "we", "us", "our", "you", "your",
  "and", "but", "or", "not", "no", "if", "when", "where", "who", "what", "which",
  "all", "each", "every", "both", "few", "more", "most", "other", "some", "such",
  "history", "life", "world", "love", "death", "war", "man", "woman", "time",
  "years", "day", "night", "house", "city", "country", "century", "part", "book"
]);

// Common French words
const FRENCH_INDICATORS = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "dans", "pour",
  "avec", "sur", "par", "qui", "que", "est", "sont", "être", "avoir", "fait",
  "cette", "ces", "tout", "tous", "plus", "aussi", "très", "bien", "même"
]);

// Detect primary language of text based on word frequency
function detectTextLanguage(text: string | null): string | null {
  if (!text || text.length < 20) return null;
  
  const words = text.toLowerCase()
    .replace(/[^a-záéíóúüñàèìòùâêîôûäëïöü\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1);
  
  if (words.length < 5) return null;
  
  let spanishScore = 0;
  let englishScore = 0;
  let frenchScore = 0;
  
  for (const word of words) {
    if (SPANISH_INDICATORS.has(word)) spanishScore++;
    if (ENGLISH_INDICATORS.has(word)) englishScore++;
    if (FRENCH_INDICATORS.has(word)) frenchScore++;
  }
  
  // Check for Spanish-specific characters (strong indicator)
  if (/[ñáéíóú]/.test(text.toLowerCase())) {
    spanishScore += 3;
  }
  
  // Check for French-specific patterns
  if (/[àâçèéêëîïôùûü]/.test(text.toLowerCase())) {
    frenchScore += 2;
  }
  
  const maxScore = Math.max(spanishScore, englishScore, frenchScore);
  
  if (maxScore < 2) return null; // Not enough evidence
  
  if (spanishScore === maxScore) return "es";
  if (englishScore === maxScore) return "en";
  if (frenchScore === maxScore) return "fr";
  
  return null;
}

// Check if book content appears to be in Spanish
function isSpanishContent(book: { title: string; description: string | null }): boolean {
  // Check title first
  const titleLang = detectTextLanguage(book.title);
  if (titleLang === "en" || titleLang === "fr") {
    // Title is clearly not Spanish, check description
    const descLang = detectTextLanguage(book.description);
    // Only reject if description is also clearly non-Spanish
    if (descLang && descLang !== "es") {
      return false;
    }
  }
  
  // Check description for stronger signal
  if (book.description && book.description.length > 50) {
    const descLang = detectTextLanguage(book.description);
    if (descLang === "en" || descLang === "fr") {
      return false;
    }
  }
  
  // If we can't determine, give benefit of the doubt
  return true;
}

// Check if a book is a Spanish edition (by metadata OR content)
function isSpanishEdition(book: { language: string | null; title: string; description: string | null }): boolean {
  const lang = normalizeLanguageCode(book.language);
  
  // If explicitly marked as Spanish, accept it
  if (lang === "es") {
    return true;
  }
  
  // If explicitly marked as another language, reject
  if (lang && lang !== "es") {
    return false;
  }
  
  // If no language metadata, check content
  return isSpanishContent(book);
}

// ============================================
// PHASE 1: Unified Search - Get results, filter locally
// ============================================

// Map English genre names to Spanish equivalents for better Spanish results
const GENRE_TRANSLATIONS: Record<string, string> = {
  "fiction": "ficción novela",
  "fantasy": "fantasía fantástico",
  "science fiction": "ciencia ficción",
  "mystery": "misterio detective",
  "thriller": "thriller suspenso",
  "romance": "romance amor",
  "horror": "terror horror",
  "history": "historia histórico",
  "biography": "biografía",
  "self-help": "autoayuda superación",
  "young adult": "juvenil adolescente",
  "children": "infantil niños",
  "poetry": "poesía",
  "drama": "drama teatro",
  "adventure": "aventura aventuras",
  "crime": "crimen policial",
  "philosophy": "filosofía",
  "psychology": "psicología",
  "science": "ciencia científico",
  "art": "arte artístico",
  "music": "música",
  "cooking": "cocina gastronomía",
  "travel": "viajes",
  "religion": "religión espiritual",
  "sports": "deportes",
  "business": "negocios empresa",
  "comics": "cómics historietas",
  "manga": "manga",
  "classics": "clásicos literatura",
  "contemporary": "contemporáneo actual",
  "literary fiction": "ficción literaria"
};

function getSpanishGenreTerms(genre: string): string {
  const lowerGenre = genre.toLowerCase();
  return GENRE_TRANSLATIONS[lowerGenre] || genre;
}

async function searchGoogleBooks(params: SearchParams): Promise<BookResult[]> {
  try {
    const results: BookResult[] = [];
    
    // Strategy: Make two searches - one with langRestrict, one with Spanish terms
    const searches: Promise<Response>[] = [];
    
    // Build base query
    let baseQuery = params.query || "";
    if (params.author) {
      baseQuery += (baseQuery ? " " : "") + `inauthor:${params.author}`;
    }
    
    // Search 1: With langRestrict=es (works well for general queries)
    let query1 = baseQuery;
    if (params.genre) {
      query1 += (query1 ? " " : "") + `subject:${params.genre}`;
    }
    if (!query1.trim()) {
      query1 = "novela literatura";
    }
    const url1 = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query1)}&maxResults=40&orderBy=relevance&langRestrict=es`;
    console.log("Google Books URL 1 (langRestrict=es):", url1);
    searches.push(fetch(url1));
    
    // Search 2: With Spanish genre terms (better for genre-based searches)
    if (params.genre) {
      const spanishGenre = getSpanishGenreTerms(params.genre);
      let query2 = baseQuery || spanishGenre;
      if (baseQuery) {
        query2 += " " + spanishGenre;
      }
      const url2 = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query2)}&maxResults=40&orderBy=relevance&langRestrict=es`;
      console.log("Google Books URL 2 (Spanish terms):", url2);
      searches.push(fetch(url2));
    }
    
    // Execute searches in parallel
    const responses = await Promise.all(searches);
    
    for (const response of responses) {
      if (!response.ok) {
        console.error("Google Books API error:", response.status);
        continue;
      }
      
      const data = await response.json();
      if (!data.items) continue;
      
      const books = data.items.map((item: any) => {
        const info = item.volumeInfo || {};
        const identifiers = info.industryIdentifiers || [];
        const rawGenres = info.categories || [];
        
        return {
          title: info.title || "",
          authors: info.authors || [],
          description: info.description || null,
          cover_url: info.imageLinks?.thumbnail?.replace("http://", "https://") || 
                     info.imageLinks?.smallThumbnail?.replace("http://", "https://") || null,
          isbn10: identifiers.find((id: any) => id.type === "ISBN_10")?.identifier || null,
          isbn13: identifiers.find((id: any) => id.type === "ISBN_13")?.identifier || null,
          genres: rawGenres,
          language: info.language || null,
          page_count: info.pageCount || null,
          published_year: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : null,
          source: "google_books",
          external_rating: info.averageRating || null,
          external_ratings_count: info.ratingsCount || null,
        };
      });
      
      results.push(...books);
    }
    
    // Filter to Spanish editions only (by metadata AND content validation)
    const spanishBooks = results.filter((book: BookResult) => {
      return isSpanishEdition(book);
    });
    
    console.log(`Google Books: ${results.length} raw results, ${spanishBooks.length} Spanish editions`);
    return spanishBooks;
  } catch (error) {
    console.error("Google Books search error:", error);
    return [];
  }
}

async function searchOpenLibrary(params: SearchParams): Promise<BookResult[]> {
  try {
    const results: BookResult[] = [];
    const searches: Promise<Response>[] = [];
    
    // Build base query parts
    let baseQuery = params.query || "";
    if (params.author) {
      baseQuery += (baseQuery ? " " : "") + `author:${params.author}`;
    }
    
    // Add year range filter if specified
    let yearFilter = "";
    if (params.yearMin !== undefined && params.yearMax !== undefined) {
      yearFilter = `first_publish_year:[${params.yearMin} TO ${params.yearMax}]`;
    }
    
    // Search 1: With language:spa filter
    let query1 = baseQuery;
    if (params.genre) {
      query1 += (query1 ? " " : "") + `subject:${params.genre}`;
    }
    query1 += (query1 ? " " : "") + `language:spa`;
    if (yearFilter) query1 += " " + yearFilter;
    if (!baseQuery && !params.genre) {
      query1 = "literatura " + query1;
    }
    
    const url1 = `https://openlibrary.org/search.json?q=${encodeURIComponent(query1)}&limit=40&fields=key,title,author_name,first_sentence,cover_i,isbn,subject,language,number_of_pages_median,first_publish_year,ratings_count,readinglog_count`;
    console.log("OpenLibrary URL 1 (language:spa):", url1);
    searches.push(fetch(url1));
    
    // Search 2: With Spanish genre terms (no language filter, rely on content detection)
    if (params.genre) {
      const spanishGenre = getSpanishGenreTerms(params.genre);
      let query2 = baseQuery || spanishGenre;
      if (baseQuery) {
        query2 += " " + spanishGenre;
      }
      if (yearFilter) query2 += " " + yearFilter;
      
      const url2 = `https://openlibrary.org/search.json?q=${encodeURIComponent(query2)}&limit=40&fields=key,title,author_name,first_sentence,cover_i,isbn,subject,language,number_of_pages_median,first_publish_year,ratings_count,readinglog_count`;
      console.log("OpenLibrary URL 2 (Spanish terms):", url2);
      searches.push(fetch(url2));
    }
    
    // Execute searches in parallel
    const responses = await Promise.all(searches);
    
    for (const response of responses) {
      if (!response.ok) {
        console.error("OpenLibrary API error:", response.status);
        continue;
      }
      
      const data = await response.json();
      if (!data.docs) continue;
      
      const books = data.docs.map((doc: any) => {
        const coverId = doc.cover_i;
        const languages = doc.language || [];
        
        // Use popularity metrics for later scoring
        const ratingsCount = doc.ratings_count || 0;
        const readinglogCount = doc.readinglog_count || 0;
        
        return {
          title: doc.title || "",
          authors: doc.author_name || [],
          description: doc.first_sentence ? 
            (Array.isArray(doc.first_sentence) ? doc.first_sentence.join(" ") : doc.first_sentence) 
            : null,
          cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
          isbn10: doc.isbn?.find((i: string) => i.length === 10) || null,
          isbn13: doc.isbn?.find((i: string) => i.length === 13) || null,
          genres: doc.subject?.slice(0, 8) || [],
          language: languages[0] || null,
          page_count: doc.number_of_pages_median || null,
          published_year: doc.first_publish_year || null,
          source: "open_library",
          popularity_score: ratingsCount + (readinglogCount * 0.1),
          external_rating: doc.ratings_average || null,
          external_ratings_count: ratingsCount || null,
        };
      });
      
      results.push(...books);
    }
    
    // Filter to Spanish editions only (by metadata AND content validation)
    const spanishBooks = results.filter((book: BookResult) => {
      return isSpanishEdition(book);
    });
    
    console.log(`OpenLibrary: ${results.length} raw results, ${spanishBooks.length} Spanish editions`);
    return spanishBooks;
  } catch (error) {
    console.error("OpenLibrary search error:", error);
    return [];
  }
}

// ============================================
// PHASE 1: Deduplication with Smart Merging
// ============================================

// List of country names to exclude from genres
const EXCLUDED_GENRE_TERMS = new Set([
  // Countries (Spanish)
  "chile", "argentina", "peru", "perú", "colombia", "mexico", "méxico", "españa", "spain",
  "venezuela", "ecuador", "bolivia", "uruguay", "paraguay", "cuba", "guatemala", "honduras",
  "el salvador", "nicaragua", "costa rica", "panama", "panamá", "puerto rico", "dominicana",
  // Countries (English)  
  "brazil", "brasil", "united states", "usa", "uk", "england", "france", "germany", "italy",
  "portugal", "china", "japan", "india", "russia", "australia", "canada", "africa",
  // Geographic terms
  "latin america", "américa latina", "south america", "sudamérica", "north america",
  "europe", "europa", "asia", "oceania", "caribbean", "caribe",
  // Other non-genre terms often found in subjects
  "accessible book", "protected daisy", "in library", "lending library",
  "open library staff picks", "internet archive wishlist", "printdisabled"
]);

function isValidGenre(genre: string): boolean {
  const normalized = genre.toLowerCase().trim();
  // Skip if it's in the exclusion list
  if (EXCLUDED_GENRE_TERMS.has(normalized)) return false;
  // Skip very short or very long subjects
  if (normalized.length < 3 || normalized.length > 40) return false;
  // Skip if it contains common non-genre patterns
  if (/^\d+$/.test(normalized)) return false; // Just numbers
  if (normalized.includes("--")) return false; // Library subject headings with --
  return true;
}

function filterGenres(genres: string[]): string[] {
  return genres.filter(isValidGenre);
}

function normalizeISBN(isbn: string | null): string | null {
  if (!isbn) return null;
  return isbn.replace(/-/g, "").trim();
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate string similarity (Jaccard-like)
function stringSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  
  if (norm1 === norm2) return 1;
  
  const words1 = new Set(norm1.split(" "));
  const words2 = new Set(norm2.split(" "));
  
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  
  return union > 0 ? intersection / union : 0;
}

// Check if two books are duplicates
function areDuplicates(book1: BookResult, book2: BookResult): boolean {
  // Check ISBN match first (most reliable)
  const isbn13_1 = normalizeISBN(book1.isbn13);
  const isbn13_2 = normalizeISBN(book2.isbn13);
  if (isbn13_1 && isbn13_2 && isbn13_1 === isbn13_2) return true;
  
  const isbn10_1 = normalizeISBN(book1.isbn10);
  const isbn10_2 = normalizeISBN(book2.isbn10);
  if (isbn10_1 && isbn10_2 && isbn10_1 === isbn10_2) return true;
  
  // Check title + author similarity
  const titleSimilarity = stringSimilarity(book1.title, book2.title);
  
  // If titles are very similar
  if (titleSimilarity > 0.8) {
    // Check if at least one author matches
    const authors1 = book1.authors.map(normalizeString);
    const authors2 = book2.authors.map(normalizeString);
    
    for (const a1 of authors1) {
      for (const a2 of authors2) {
        if (stringSimilarity(a1, a2) > 0.7) {
          return true;
        }
      }
    }
    
    // If both have no authors, consider them duplicates based on title
    if (authors1.length === 0 && authors2.length === 0) {
      return true;
    }
  }
  
  return false;
}

// Merge two book entries, taking best data from each
function mergeBooks(book1: BookResult, book2: BookResult): BookResult {
  // Prefer Google Books for cover (usually higher quality)
  // Prefer OpenLibrary for metadata completeness
  
  const getSource = (b: BookResult) => b.source === "google_books" ? 1 : 0;
  
  // Choose best cover (prefer existing over null, prefer google for quality)
  let cover_url = book1.cover_url || book2.cover_url;
  if (book1.cover_url && book2.cover_url) {
    // Prefer Google Books cover for quality
    cover_url = book1.source === "google_books" ? book1.cover_url : book2.cover_url;
    if (book2.source === "google_books") cover_url = book2.cover_url;
  }
  
  // Choose longer/better description
  let description = book1.description || book2.description;
  if (book1.description && book2.description) {
    description = book1.description.length > book2.description.length ? 
      book1.description : book2.description;
  }
  
  // Merge genres (filtering out country names)
  const allGenres = filterGenres([...new Set([...(book1.genres || []), ...(book2.genres || [])])]);
  
  // Prefer the more complete ISBN
  const isbn13 = book1.isbn13 || book2.isbn13;
  const isbn10 = book1.isbn10 || book2.isbn10;
  
  return {
    title: book1.title.length >= book2.title.length ? book1.title : book2.title,
    authors: book1.authors.length >= book2.authors.length ? book1.authors : book2.authors,
    description,
    cover_url,
    isbn10,
    isbn13,
    genres: allGenres.slice(0, 5),
    language: book1.language || book2.language,
    page_count: book1.page_count || book2.page_count,
    published_year: book1.published_year || book2.published_year,
    source: "merged",
    // Merge external ratings - prefer Google's ratings as they're usually more complete
    external_rating: book1.external_rating || book2.external_rating,
    external_ratings_count: (book1.external_ratings_count || 0) + (book2.external_ratings_count || 0),
  };
}

// Deduplicate and merge results - prioritizing books found in both sources
function deduplicateAndMerge(results: BookResult[]): BookResult[] {
  const uniqueBooks: BookResult[] = [];
  
  for (const book of results) {
    // Filter genres for each book
    const filteredBook = {
      ...book,
      genres: filterGenres(book.genres || []).slice(0, 5)
    };
    
    let foundDuplicate = false;
    
    for (let i = 0; i < uniqueBooks.length; i++) {
      if (areDuplicates(uniqueBooks[i], filteredBook)) {
        // Mark as found in both sources (more relevant)
        const merged = mergeBooks(uniqueBooks[i], filteredBook);
        merged.found_in_both = true;
        // Combine popularity scores
        merged.popularity_score = (uniqueBooks[i].popularity_score || 0) + (filteredBook.popularity_score || 0);
        uniqueBooks[i] = merged;
        foundDuplicate = true;
        break;
      }
    }
    
    if (!foundDuplicate) {
      uniqueBooks.push({ ...filteredBook, found_in_both: false });
    }
  }
  
  return uniqueBooks;
}

// ============================================
// PHASE 2: Relevance Scoring
// ============================================

function calculateRelevanceScore(
  book: BookResult, 
  searchQuery: string,
  userLanguage: string | null,
  params: SearchParams
): number {
  let score = 0;
  
  // ---- BONUS: Found in both sources (very relevant) - 25 points ----
  if (book.found_in_both) {
    score += 25;
  }
  
  // ---- Title match (0-30 points) ----
  const normalizedQuery = normalizeString(searchQuery);
  const normalizedTitle = normalizeString(book.title);
  
  if (normalizedQuery) {
    if (normalizedTitle === normalizedQuery) {
      score += 30; // Exact match
    } else if (normalizedTitle.includes(normalizedQuery)) {
      score += 25; // Contains query
    } else if (normalizedTitle.startsWith(normalizedQuery.split(" ")[0])) {
      score += 20; // Starts with first word
    } else {
      score += stringSimilarity(normalizedTitle, normalizedQuery) * 20;
    }
  }
  
  // ---- Author match (0-15 points) ----
  if (params.author) {
    const normalizedAuthorFilter = normalizeString(params.author);
    for (const author of book.authors) {
      const normalizedAuthor = normalizeString(author);
      if (normalizedAuthor.includes(normalizedAuthorFilter) || 
          normalizedAuthorFilter.includes(normalizedAuthor)) {
        score += 15;
        break;
      }
    }
  } else if (book.authors.length > 0) {
    score += 5; // Has authors
  }
  
  // ---- Language preference (0-20 points) ----
  if (userLanguage && book.language) {
    // Normalize language codes
    const langMap: Record<string, string> = {
      "spa": "es", "eng": "en", "fre": "fr", "ger": "de", 
      "por": "pt", "ita": "it", "cat": "ca"
    };
    let bookLang = book.language.toLowerCase().substring(0, 3);
    bookLang = langMap[bookLang] || bookLang.substring(0, 2);
    const userLang = userLanguage.toLowerCase().substring(0, 2);
    
    if (bookLang === userLang) {
      score += 20; // Matches user's language
    } else if (["en", "es"].includes(bookLang)) {
      score += 5; // Common languages get small boost
    }
  }
  
  // ---- Cover image (0-10 points) ----
  if (book.cover_url) {
    score += 10;
  }
  
  // ---- Popularity bonus (0-15 points) ----
  if (book.popularity_score) {
    // Log scale for popularity to prevent huge scores from dominating
    const popBonus = Math.min(15, Math.log10(book.popularity_score + 1) * 5);
    score += popBonus;
  }
  
  // ---- Metadata completeness (0-15 points) ----
  if (book.description && book.description.length > 50) score += 4;
  if (book.isbn13 || book.isbn10) score += 3;
  if (book.page_count && book.page_count > 0) score += 2;
  if (book.published_year) score += 3;
  if (book.genres && book.genres.length > 0) score += 3;
  
  // ---- Genre match (0-10 points) ----
  if (params.genre && book.genres) {
    const normalizedGenre = normalizeString(params.genre);
    for (const genre of book.genres) {
      if (normalizeString(genre).includes(normalizedGenre)) {
        score += 10;
        break;
      }
    }
  }
  
  // ---- Year match (0-5 points) ----
  if (params.yearMin !== undefined && params.yearMax !== undefined && book.published_year) {
    if (book.published_year >= params.yearMin && book.published_year <= params.yearMax) {
      score += 5;
    }
  }
  
  // ---- Title quality (0-5 points) ----
  // Penalize titles that are all caps or look malformed
  if (book.title) {
    const hasProperCase = /^[A-Z][a-z]/.test(book.title) || /^[a-z]/.test(book.title);
    const isAllCaps = book.title === book.title.toUpperCase() && book.title.length > 5;
    
    if (hasProperCase && !isAllCaps) {
      score += 5;
    }
  }
  
  // ---- Penalize incomplete data ----
  if (!book.title || book.title.length < 2) score -= 20;
  if (!book.authors || book.authors.length === 0 || 
      (book.authors.length === 1 && book.authors[0] === "")) {
    score -= 10;
  }
  
  return score;
}

// ============================================
// PHASE 3 & 4: Filter application
// ============================================

function applyFilters(books: BookResult[], params: SearchParams): BookResult[] {
  return books.filter(book => {
    // Year range filter
    if (params.yearMin !== undefined && params.yearMax !== undefined) {
      if (!book.published_year) return false;
      if (book.published_year < params.yearMin || book.published_year > params.yearMax) {
        return false;
      }
    }
    
    // Language filter (strict - only if explicitly set by user)
    if (params.language && params.language !== "all") {
      if (!book.language) return false;
      const bookLang = book.language.toLowerCase().substring(0, 2);
      const filterLang = params.language.toLowerCase().substring(0, 2);
      if (bookLang !== filterLang) return false;
    }
    
    return true;
  });
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const params: SearchParams = {
      query: body.query || body.isbn,
      isbn: body.isbn,
      author: body.author,
      genre: body.genre,
      yearMin: body.yearMin,
      yearMax: body.yearMax,
      language: body.language,
      userLanguage: body.userLanguage,
    };
    
    console.log("Search params:", params);
    
    // Allow search with just filters (author, genre, language, year) even without a title query
    const hasSearchCriteria = params.query || params.isbn || params.author || params.genre || 
                              (params.yearMin !== undefined && params.yearMax !== undefined) ||
                              (params.language && params.language !== "all");
    
    if (!hasSearchCriteria) {
      return new Response(
        JSON.stringify({ error: "Se requiere al menos un criterio de búsqueda" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PHASE 1: Search both APIs in parallel with fallback
    const [googleResults, openLibraryResults] = await Promise.allSettled([
      searchGoogleBooks(params),
      searchOpenLibrary(params),
    ]);

    // Extract results, handling failures
    const google = googleResults.status === "fulfilled" ? googleResults.value : [];
    const openLib = openLibraryResults.status === "fulfilled" ? openLibraryResults.value : [];
    
    console.log(`Google Books: ${google.length} results, OpenLibrary: ${openLib.length} results`);

    // PHASE 1: Combine and deduplicate with smart merging
    const allResults = [...google, ...openLib];
    const uniqueResults = deduplicateAndMerge(allResults);
    
    console.log(`After deduplication: ${uniqueResults.length} unique results`);

    // PHASE 3: Apply filters
    let filteredResults = applyFilters(uniqueResults, params);
    
    console.log(`After filtering: ${filteredResults.length} results`);

    // PHASE 2: Calculate relevance scores and sort
    const searchQuery = params.query || "";
    const scoredResults = filteredResults.map(book => ({
      ...book,
      relevance_score: calculateRelevanceScore(book, searchQuery, params.userLanguage || null, params)
    }));
    
    // Sort by relevance score (highest first)
    scoredResults.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    
    // Take top 15 results - NO translation needed, only Spanish editions from API
    const topResults = scoredResults.slice(0, 15);
    
    console.log(`Returning ${topResults.length} Spanish edition results`);
    
    // Remove the internal scores from the final output
    const finalResults = topResults.map(({ relevance_score, popularity_score, found_in_both, ...book }) => book);

    return new Response(
      JSON.stringify({ 
        results: finalResults,
        meta: {
          total: scoredResults.length,
          sources: {
            google_books: google.length,
            open_library: openLib.length
          },
          spanish_only: true
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search books" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
