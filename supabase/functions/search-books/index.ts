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
// PHASE 1: Unified Search with Fallback
// ============================================

async function searchGoogleBooks(params: SearchParams): Promise<BookResult[]> {
  try {
    let searchQuery = params.query || "";
    
    // Add author filter to query
    if (params.author) {
      searchQuery += ` inauthor:${params.author}`;
    }
    
    // Add genre/subject filter
    if (params.genre) {
      searchQuery += ` subject:${params.genre}`;
    }
    
    // Build URL with language restriction if provided
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=20`;
    
    // Apply language restriction if user has a preferred language
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
      
      return {
        title: info.title || "",
        authors: info.authors || [],
        description: info.description || null,
        cover_url: info.imageLinks?.thumbnail?.replace("http://", "https://") || 
                   info.imageLinks?.smallThumbnail?.replace("http://", "https://") || null,
        isbn10: identifiers.find((id: any) => id.type === "ISBN_10")?.identifier || null,
        isbn13: identifiers.find((id: any) => id.type === "ISBN_13")?.identifier || null,
        genres: info.categories || [],
        language: info.language || null,
        page_count: info.pageCount || null,
        published_year: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : null,
        source: "google_books",
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
      searchQuery += ` author:${params.author}`;
    }
    
    // Add subject for genre
    if (params.genre) {
      searchQuery += ` subject:${params.genre}`;
    }
    
    let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=20`;
    
    // Add language filter if specified
    if (params.language && params.language !== "all") {
      url += `&language=${params.language}`;
    }
    
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
      
      return {
        title: doc.title || "",
        authors: doc.author_name || [],
        description: doc.first_sentence ? 
          (Array.isArray(doc.first_sentence) ? doc.first_sentence.join(" ") : doc.first_sentence) 
          : null,
        cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
        isbn10: doc.isbn?.find((i: string) => i.length === 10) || null,
        isbn13: doc.isbn?.find((i: string) => i.length === 13) || null,
        genres: doc.subject?.slice(0, 5) || [],
        language: languages[0] || null,
        page_count: doc.number_of_pages_median || null,
        published_year: doc.first_publish_year || null,
        source: "open_library",
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
  
  // Merge genres
  const allGenres = [...new Set([...(book1.genres || []), ...(book2.genres || [])])];
  
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
  };
}

// Deduplicate and merge results
function deduplicateAndMerge(results: BookResult[]): BookResult[] {
  const uniqueBooks: BookResult[] = [];
  
  for (const book of results) {
    let foundDuplicate = false;
    
    for (let i = 0; i < uniqueBooks.length; i++) {
      if (areDuplicates(uniqueBooks[i], book)) {
        // Merge the books
        uniqueBooks[i] = mergeBooks(uniqueBooks[i], book);
        foundDuplicate = true;
        break;
      }
    }
    
    if (!foundDuplicate) {
      uniqueBooks.push(book);
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
  
  // ---- Title match (0-30 points) ----
  const normalizedQuery = normalizeString(searchQuery);
  const normalizedTitle = normalizeString(book.title);
  
  if (normalizedTitle === normalizedQuery) {
    score += 30; // Exact match
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 25; // Contains query
  } else if (normalizedTitle.startsWith(normalizedQuery.split(" ")[0])) {
    score += 20; // Starts with first word
  } else {
    score += stringSimilarity(normalizedTitle, normalizedQuery) * 20;
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
    const bookLang = book.language.toLowerCase().substring(0, 2);
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
    
    if (!params.query && !params.isbn) {
      return new Response(
        JSON.stringify({ error: "Query or ISBN is required" }),
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
    
    // Remove the score from the final output (optional - could be useful for debugging)
    const finalResults = scoredResults.map(({ relevance_score, ...book }) => book);

    return new Response(
      JSON.stringify({ 
        results: finalResults.slice(0, 20),
        meta: {
          total: finalResults.length,
          sources: {
            google_books: google.length,
            open_library: openLib.length
          }
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
