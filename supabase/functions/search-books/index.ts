import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
}

// Search Google Books API
async function searchGoogleBooks(query: string): Promise<BookResult[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=es,en`;
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
        title: info.title || "Sin título",
        authors: info.authors || ["Autor desconocido"],
        description: info.description || null,
        cover_url: info.imageLinks?.thumbnail?.replace("http://", "https://") || null,
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

// Search OpenLibrary API
async function searchOpenLibrary(query: string): Promise<BookResult[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("OpenLibrary API error:", response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.docs) return [];

    return data.docs.map((doc: any) => {
      const coverId = doc.cover_i;
      
      return {
        title: doc.title || "Sin título",
        authors: doc.author_name || ["Autor desconocido"],
        description: doc.first_sentence?.join(" ") || null,
        cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
        isbn10: doc.isbn?.[0]?.length === 10 ? doc.isbn[0] : null,
        isbn13: doc.isbn?.find((i: string) => i.length === 13) || null,
        genres: doc.subject?.slice(0, 5) || [],
        language: doc.language?.[0] || null,
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

// Normalize ISBN (remove hyphens)
function normalizeISBN(isbn: string | null): string | null {
  if (!isbn) return null;
  return isbn.replace(/-/g, "");
}

// Deduplicate results by ISBN or title+author
function deduplicateResults(results: BookResult[]): BookResult[] {
  const seen = new Map<string, BookResult>();
  
  for (const book of results) {
    const isbn13 = normalizeISBN(book.isbn13);
    const isbn10 = normalizeISBN(book.isbn10);
    
    // Use ISBN as primary key if available
    if (isbn13) {
      if (!seen.has(isbn13)) {
        seen.set(isbn13, book);
      }
      continue;
    }
    
    if (isbn10) {
      if (!seen.has(isbn10)) {
        seen.set(isbn10, book);
      }
      continue;
    }
    
    // Fall back to title+author key
    const key = `${book.title.toLowerCase()}-${book.authors.join(",").toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, book);
    }
  }
  
  return Array.from(seen.values());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, isbn } = await req.json();
    
    if (!query && !isbn) {
      return new Response(
        JSON.stringify({ error: "Query or ISBN is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchTerm = isbn || query;
    
    // Search both APIs in parallel
    const [googleResults, openLibraryResults] = await Promise.all([
      searchGoogleBooks(searchTerm),
      searchOpenLibrary(searchTerm),
    ]);

    // Combine and deduplicate
    const allResults = [...googleResults, ...openLibraryResults];
    const uniqueResults = deduplicateResults(allResults);

    // Sort by having a cover image and more complete data
    uniqueResults.sort((a, b) => {
      const scoreA = (a.cover_url ? 2 : 0) + (a.description ? 1 : 0) + (a.isbn13 ? 1 : 0);
      const scoreB = (b.cover_url ? 2 : 0) + (b.description ? 1 : 0) + (b.isbn13 ? 1 : 0);
      return scoreB - scoreA;
    });

    return new Response(
      JSON.stringify({ results: uniqueResults.slice(0, 15) }),
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
