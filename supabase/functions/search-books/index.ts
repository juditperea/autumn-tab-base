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
// SMART TRANSLATION with Lovable AI
// ============================================

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish",
  en: "English",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
  ca: "Catalan",
};

// Check if text contains non-Latin characters (Cyrillic, Arabic, Chinese, Japanese, Korean, etc.)
function containsNonLatinCharacters(text: string): boolean {
  // Regex for non-Latin scripts
  const nonLatinRegex = /[\u0400-\u04FF]|[\u0600-\u06FF]|[\u4E00-\u9FFF]|[\u3040-\u30FF]|[\uAC00-\uD7AF]|[\u0370-\u03FF]|[\u0590-\u05FF]|[\u0900-\u097F]|[\u0E00-\u0E7F]/;
  return nonLatinRegex.test(text);
}

// Check if title looks like a proper name or recognized work that shouldn't be translated
function shouldNotTranslateTitle(title: string): boolean {
  // Common patterns that indicate proper names or brand-like titles
  const properNamePatterns = [
    /^[A-Z][a-z]+ [A-Z][a-z]+$/, // "Harry Potter", "Don Quijote"
    /^(The |El |La |Le |Der |Das |Il |O )?[A-Z][a-z]+ (of|de|del|di|du|von|of the) /i, // "Lord of the Rings"
  ];
  
  // If it's very short (1-2 words) and all Latin, likely a proper name
  const words = title.trim().split(/\s+/);
  if (words.length <= 2 && !containsNonLatinCharacters(title)) {
    return true;
  }
  
  return properNamePatterns.some(pattern => pattern.test(title));
}

interface TranslationResult {
  index: number;
  title: string;
  description: string | null;
  genres: string[];
}

async function translateBookBatch(
  books: BookResult[],
  targetLanguage: string
): Promise<BookResult[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not configured, skipping translation");
    return books;
  }

  // Normalize language codes for comparison
  const normalizedLang: Record<string, string> = {
    "spa": "es", "eng": "en", "fre": "fr", "ger": "de", 
    "por": "pt", "ita": "it", "cat": "ca",
    "spanish": "es", "english": "en", "french": "fr", "german": "de",
    "portuguese": "pt", "italian": "it", "catalan": "ca"
  };

  const normalizeBookLanguage = (lang: string | null): string | null => {
    if (!lang) return null;
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
  };

  // TRANSLATE all titles/descriptions from different languages
  // Always keep original title for display below
  const booksToTranslate: { book: BookResult; originalIndex: number; translateTitle: boolean }[] = [];
  
  for (let i = 0; i < books.length && booksToTranslate.length < 8; i++) {
    const book = books[i];
    const bookLang = normalizeBookLanguage(book.language);
    
    // Check if language is different from target
    const isDifferentLang = bookLang && bookLang !== targetLanguage;
    
    // Skip proper names (short titles 1-2 words that are clearly names)
    const isProperName = shouldNotTranslateTitle(book.title);
    
    if (isDifferentLang) {
      booksToTranslate.push({ 
        book, 
        originalIndex: i,
        translateTitle: !isProperName // Translate title unless it's a proper name
      });
    }
  }

  if (booksToTranslate.length === 0) {
    console.log("No books need translation");
    return books;
  }

  console.log(`Translating ${booksToTranslate.length} books to ${targetLanguage}`);

  try {
    // Prepare translation request - only include titles that need translation
    const booksData = booksToTranslate.map(({ book, translateTitle }, index) => ({
      i: index,
      t: translateTitle ? book.title : null, // Only include title if it needs translation
      d: book.description ? book.description.substring(0, 200) : null,
    }));

    const targetLangName = LANGUAGE_NAMES[targetLanguage] || "Spanish";

    // Add timeout to prevent slow responses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Translate book titles and descriptions to ${targetLangName}. 
RULES:
- If "t" is null, don't include it in output
- NEVER translate author names
- NEVER translate publisher names
- Keep proper nouns as-is (character names, place names)
- For non-Latin script titles, provide a readable translation
Return ONLY a JSON array.`
          },
          {
            role: "user",
            content: `Translate to ${targetLangName}. Return JSON array only, no markdown:
${JSON.stringify(booksData)}

Format: [{"i":0,"t":"translated title or null","d":"translated desc or null"}]`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return books;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No translation content received");
      return books;
    }

    // Parse the JSON response with better error handling
    let translations: { i: number; t: string | null; d: string | null }[];
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      
      // Find the array bounds
      const startIdx = cleanContent.indexOf('[');
      const endIdx = cleanContent.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx > startIdx) {
        cleanContent = cleanContent.substring(startIdx, endIdx + 1);
      }
      
      translations = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse translation response");
      return books;
    }

    // Create result array
    const result = [...books];
    
    for (const t of translations) {
      if (typeof t.i !== 'number' || t.i >= booksToTranslate.length) continue;
      
      const { book, originalIndex, translateTitle } = booksToTranslate[t.i];
      
      // Apply title translation if we requested it AND got a valid translation
      const newTitle = (translateTitle && t.t) ? t.t : book.title;
      const wasTranslated = translateTitle && t.t && t.t !== book.title;
      
      result[originalIndex] = {
        ...book,
        // ALWAYS keep original title for display below translated title
        original_title: book.title,
        original_description: book.description ?? undefined,
        // Use translated title if available
        title: newTitle,
        description: t.d || book.description,
        // Mark as translated if title or description changed
        translated: wasTranslated || (t.d && t.d !== book.description) ? true : undefined,
      };
    }

    console.log(`Successfully processed ${translations.length} books`);
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log("Translation timed out, returning original books");
    } else {
      console.error("Translation error:", error);
    }
    return books;
  }
}

// ============================================
// PHASE 1: Unified Search with Fallback
// ============================================

async function searchGoogleBooks(params: SearchParams): Promise<BookResult[]> {
  try {
    let searchQuery = params.query || "";
    
    // Add author filter to query using intitle: if we have a query, otherwise just author
    if (params.author) {
      searchQuery += (searchQuery ? " " : "") + `inauthor:${params.author}`;
    }
    
    // Add genre/subject filter - Google doesn't have strict subject filter, 
    // so we add it as a term in the query
    if (params.genre) {
      searchQuery += (searchQuery ? " " : "") + `subject:${params.genre}`;
    }
    
    // If no query but we have language filter, use a broad term to get results
    if (!searchQuery.trim()) {
      if (params.language && params.language !== "all") {
        // Use a common search term based on language to get popular books
        const langTerms: Record<string, string> = {
          "es": "literatura novela", "en": "novel fiction", "fr": "roman litterature",
          "de": "roman literatur", "pt": "romance literatura", "it": "romanzo letteratura"
        };
        searchQuery = langTerms[params.language] || "fiction";
      } else {
        return [];
      }
    }
    
    // Build URL with language restriction if provided - request more results to filter later
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=30&orderBy=relevance`;
    
    // Apply strict language restriction if user has specified a language
    if (params.language && params.language !== "all") {
      url += `&langRestrict=${params.language}`;
    } else if (params.userLanguage) {
      // Use user's browser language as preference (not strict filter)
      url += `&langRestrict=${params.userLanguage}`;
    }
    
    console.log("Google Books URL:", url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Google Books API error:", response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.items) return [];

    return data.items.map((item: any) => {
      const info = item.volumeInfo || {};
      const identifiers = info.industryIdentifiers || [];
      
      // Filter out country-based categories
      const rawGenres = info.categories || [];
      
      return {
        title: info.title || "",
        authors: info.authors || [],
        description: info.description || null,
        cover_url: info.imageLinks?.thumbnail?.replace("http://", "https://") || 
                   info.imageLinks?.smallThumbnail?.replace("http://", "https://") || null,
        isbn10: identifiers.find((id: any) => id.type === "ISBN_10")?.identifier || null,
        isbn13: identifiers.find((id: any) => id.type === "ISBN_13")?.identifier || null,
        genres: rawGenres, // Will be filtered later
        language: info.language || null,
        page_count: info.pageCount || null,
        published_year: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : null,
        source: "google_books",
        // Add ratings data from Google
        external_rating: info.averageRating || null,
        external_ratings_count: info.ratingsCount || null,
      };
    });
  } catch (error) {
    console.error("Google Books search error:", error);
    return [];
  }
}

async function searchOpenLibrary(params: SearchParams): Promise<BookResult[]> {
  try {
    let searchQuery = params.query || "";
    
    // Add author to query for OpenLibrary
    if (params.author) {
      searchQuery += (searchQuery ? " " : "") + `author:${params.author}`;
    }
    
    // Add subject for genre
    if (params.genre) {
      searchQuery += (searchQuery ? " " : "") + `subject:${params.genre}`;
    }
    
    // Add language filter directly in query for better filtering
    // OpenLibrary uses ISO 639-2/3 language codes (spa, eng, fre, etc.)
    if (params.language && params.language !== "all") {
      const langMap: Record<string, string> = {
        "es": "spa", "en": "eng", "fr": "fre", "de": "ger", 
        "pt": "por", "it": "ita", "ca": "cat"
      };
      const olLangCode = langMap[params.language] || params.language;
      searchQuery += (searchQuery ? " " : "") + `language:${olLangCode}`;
    }
    
    // Add year range filter if specified
    if (params.yearMin !== undefined && params.yearMax !== undefined) {
      searchQuery += (searchQuery ? " " : "") + `first_publish_year:[${params.yearMin} TO ${params.yearMax}]`;
    }
    
    // If still no query, try with a broad term
    if (!searchQuery.trim()) {
      // OpenLibrary requires some query, so we skip if truly empty
      return [];
    }
    
    // Use fields parameter to get more complete data
    let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=25&fields=key,title,author_name,first_sentence,cover_i,isbn,subject,language,number_of_pages_median,first_publish_year,ratings_count,readinglog_count`;
    
    console.log("OpenLibrary URL:", url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("OpenLibrary API error:", response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.docs) return [];

    return data.docs.map((doc: any) => {
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
        genres: doc.subject?.slice(0, 8) || [], // Get more, will filter later
        language: languages[0] || null,
        page_count: doc.number_of_pages_median || null,
        published_year: doc.first_publish_year || null,
        source: "open_library",
        // Add popularity data for relevance scoring
        popularity_score: ratingsCount + (readinglogCount * 0.1),
        // OpenLibrary has ratings too
        external_rating: doc.ratings_average || null,
        external_ratings_count: ratingsCount || null,
      };
    });
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
    
    // Take top 15 results (translation is limited to first 8 non-matching language)
    const topResults = scoredResults.slice(0, 15);
    
    // PHASE 5: Translate books to user's language (with timeout protection)
    let translatedResults: BookResult[] = topResults;
    if (params.userLanguage) {
      const targetLang = params.userLanguage.toLowerCase().substring(0, 2);
      translatedResults = await translateBookBatch(topResults, targetLang);
      console.log(`Translated ${translatedResults.filter(b => b.translated).length} books to ${targetLang}`);
    }
    
    // Remove the internal scores from the final output
    const finalResults = translatedResults.map(({ relevance_score, popularity_score, found_in_both, ...book }) => book);

    return new Response(
      JSON.stringify({ 
        results: finalResults,
        meta: {
          total: scoredResults.length,
          sources: {
            google_books: google.length,
            open_library: openLib.length
          },
          translated: translatedResults.filter(b => b.translated).length
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
