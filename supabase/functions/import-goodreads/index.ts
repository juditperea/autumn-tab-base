import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookMetadata {
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
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  skipped: number;
  enriched: number;
  errors: string[];
}

// ============================================
// External API Functions - Fetch metadata by ISBN
// ============================================

async function fetchFromGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.items || data.items.length === 0) return null;
    
    const info = data.items[0].volumeInfo || {};
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
    };
  } catch (error) {
    console.error("Google Books fetch error:", error);
    return null;
  }
}

async function fetchFromOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  try {
    // Try the ISBN endpoint first
    const url = `https://openlibrary.org/isbn/${isbn}.json`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Get author names
    let authors: string[] = [];
    if (data.authors) {
      const authorPromises = data.authors.map(async (author: any) => {
        if (author.key) {
          try {
            const authorResp = await fetch(`https://openlibrary.org${author.key}.json`);
            if (authorResp.ok) {
              const authorData = await authorResp.json();
              return authorData.name || null;
            }
          } catch {
            return null;
          }
        }
        return null;
      });
      const authorResults = await Promise.all(authorPromises);
      authors = authorResults.filter((a): a is string => a !== null);
    }
    
    // Get cover
    let cover_url: string | null = null;
    if (data.covers && data.covers.length > 0) {
      cover_url = `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`;
    }
    
    // Get description
    let description: string | null = null;
    if (data.description) {
      description = typeof data.description === 'string' 
        ? data.description 
        : data.description.value || null;
    }
    
    return {
      title: data.title || "",
      authors,
      description,
      cover_url,
      isbn10: data.isbn_10?.[0] || null,
      isbn13: data.isbn_13?.[0] || null,
      genres: data.subjects?.slice(0, 5) || [],
      language: null, // OpenLibrary uses language keys, would need extra fetch
      page_count: data.number_of_pages || null,
      published_year: data.publish_date ? parseInt(data.publish_date) : null,
    };
  } catch (error) {
    console.error("OpenLibrary fetch error:", error);
    return null;
  }
}

// Merge metadata from multiple sources
function mergeMetadata(
  csvData: { title: string; author: string; numberOfPages: number | null },
  google: BookMetadata | null,
  openlib: BookMetadata | null
): BookMetadata {
  // Prefer Google for cover (usually higher quality)
  // Prefer longer description
  // Merge genres
  
  const cover_url = google?.cover_url || openlib?.cover_url || null;
  
  let description = google?.description || openlib?.description || null;
  if (google?.description && openlib?.description) {
    description = google.description.length > openlib.description.length 
      ? google.description 
      : openlib.description;
  }
  
  const allGenres = [
    ...(google?.genres || []),
    ...(openlib?.genres || [])
  ];
  const uniqueGenres = [...new Set(allGenres)].slice(0, 5);
  
  return {
    title: google?.title || openlib?.title || csvData.title,
    authors: google?.authors?.length ? google.authors : 
             openlib?.authors?.length ? openlib.authors : 
             csvData.author ? [csvData.author] : [],
    description,
    cover_url,
    isbn10: google?.isbn10 || openlib?.isbn10 || null,
    isbn13: google?.isbn13 || openlib?.isbn13 || null,
    genres: uniqueGenres,
    language: google?.language || openlib?.language || null,
    page_count: google?.page_count || openlib?.page_count || csvData.numberOfPages,
    published_year: google?.published_year || openlib?.published_year || null,
  };
}

// Fetch and merge book metadata by ISBN
async function enrichBookMetadata(
  isbn: string | null,
  isbn13: string | null,
  csvData: { title: string; author: string; numberOfPages: number | null }
): Promise<BookMetadata> {
  // Try with ISBN13 first (more reliable), then ISBN10
  const isbnToUse = isbn13 || isbn;
  
  if (!isbnToUse) {
    // No ISBN, return basic data from CSV
    return {
      title: csvData.title,
      authors: csvData.author ? [csvData.author] : [],
      description: null,
      cover_url: null,
      isbn10: isbn,
      isbn13: isbn13,
      genres: [],
      language: null,
      page_count: csvData.numberOfPages,
      published_year: null,
    };
  }
  
  // Fetch from both APIs in parallel
  const [googleData, openLibData] = await Promise.all([
    fetchFromGoogleBooks(isbnToUse),
    fetchFromOpenLibrary(isbnToUse),
  ]);
  
  console.log(`ISBN ${isbnToUse}: Google=${!!googleData}, OpenLib=${!!openLibData}`);
  
  // Merge results with CSV data as fallback
  const merged = mergeMetadata(csvData, googleData, openLibData);
  
  // Ensure we keep the ISBNs from CSV if not found in APIs
  if (!merged.isbn10 && isbn) merged.isbn10 = isbn;
  if (!merged.isbn13 && isbn13) merged.isbn13 = isbn13;
  
  return merged;
}

// ============================================
// Input Validation (rows are parsed client-side)
// ============================================

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null);

const RowSchema = z.object({
  title: z.string().min(1).max(500),
  author: z.string().max(300).default(""),
  isbn: z.string().max(20).nullable().default(null),
  isbn13: z.string().max(20).nullable().default(null),
  myRating: z.number().int().min(0).max(5).default(0),
  dateRead: isoDate,
  dateAdded: isoDate,
  shelf: z.string().max(100).default("to-read"),
  pages: z.number().int().positive().nullable().default(null),
});

const BodySchema = z.object({
  rows: z.array(RowSchema).min(1).max(5000),
});

// ============================================
// Helper Functions
// ============================================

function mapShelfToStatus(shelf: string): string {
  const shelfLower = shelf.toLowerCase();
  if (shelfLower === 'read') return 'read';
  if (shelfLower === 'currently-reading') return 'reading';
  if (shelfLower === 'to-read') return 'to_read';
  if (shelfLower === 'did-not-finish') return 'dnf';
  return 'to_read';
}

function convertRating(grRating: number): number | null {
  if (!grRating || grRating === 0) return null;
  return Math.min(10, Math.max(1, grRating * 2));
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '') return null;
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

function cleanISBN(isbn: string): string | null {
  if (!isbn) return null;
  const cleaned = isbn.replace(/[="']/g, '').trim();
  return cleaned || null;
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("Importing for user:", userId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { csvContent } = await req.json();
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: "No CSV content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = parseCSV(csvContent);
    console.log(`Parsed ${rows.length} rows from CSV`);

    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      enriched: 0,
      errors: [],
    };

    // Process books in batches to avoid rate limiting
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (row) => {
        try {
          const title = row['Title'] || '';
          const author = row['Author'] || '';
          const isbn = cleanISBN(row['ISBN']);
          const isbn13 = cleanISBN(row['ISBN13']);
          const myRating = parseInt(row['My Rating'] || '0', 10);
          const dateRead = parseDate(row['Date Read']);
          const dateAdded = parseDate(row['Date Added']);
          const bookshelf = row['Exclusive Shelf'] || row['Bookshelves'] || 'to-read';
          const numberOfPages = parseInt(row['Number of Pages'] || '0', 10) || null;

          if (!title) {
            result.skipped++;
            return;
          }

          // Try to find existing book by ISBN
          let bookId: string | null = null;
          let needsEnrichment = false;

          if (isbn13) {
            const { data: existingBook } = await supabase
              .from('books')
              .select('id, cover_url, description')
              .eq('isbn13', isbn13)
              .maybeSingle();
            
            if (existingBook) {
              bookId = existingBook.id;
              // Check if book needs enrichment (no cover or description)
              needsEnrichment = !existingBook.cover_url || !existingBook.description;
            }
          }

          if (!bookId && isbn) {
            const { data: existingBook } = await supabase
              .from('books')
              .select('id, cover_url, description')
              .eq('isbn10', isbn)
              .maybeSingle();
            
            if (existingBook) {
              bookId = existingBook.id;
              needsEnrichment = !existingBook.cover_url || !existingBook.description;
            }
          }

          // If not found by ISBN, try by title
          if (!bookId) {
            const { data: existingBook } = await supabase
              .from('books')
              .select('id, cover_url, description')
              .ilike('title', title)
              .maybeSingle();
            
            if (existingBook) {
              bookId = existingBook.id;
              needsEnrichment = !existingBook.cover_url || !existingBook.description;
            }
          }

          // If book doesn't exist or needs enrichment, fetch metadata from APIs
          if (!bookId || needsEnrichment) {
            const metadata = await enrichBookMetadata(isbn, isbn13, { 
              title, 
              author, 
              numberOfPages 
            });

            if (!bookId) {
              // Create new book with enriched metadata
              const { data: newBook, error: insertError } = await supabase
                .from('books')
                .insert({
                  title: metadata.title,
                  authors: metadata.authors,
                  description: metadata.description,
                  cover_url: metadata.cover_url,
                  isbn10: metadata.isbn10,
                  isbn13: metadata.isbn13,
                  genres: metadata.genres,
                  language: metadata.language,
                  page_count: metadata.page_count,
                  published_year: metadata.published_year,
                  source: 'goodreads_import',
                })
                .select('id')
                .single();

              if (insertError) {
                console.error('Error inserting book:', insertError);
                result.errors.push(`Error adding "${title}": ${insertError.message}`);
                return;
              }

              bookId = newBook.id;
              
              if (metadata.cover_url || metadata.description) {
                result.enriched++;
              }
            } else if (needsEnrichment) {
              // Update existing book with enriched metadata
              const updates: Record<string, any> = {};
              if (metadata.cover_url) updates.cover_url = metadata.cover_url;
              if (metadata.description) updates.description = metadata.description;
              if (metadata.genres?.length) updates.genres = metadata.genres;
              if (metadata.published_year) updates.published_year = metadata.published_year;
              if (metadata.language) updates.language = metadata.language;
              
              if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                  .from('books')
                  .update(updates)
                  .eq('id', bookId);
                
                if (!updateError) {
                  result.enriched++;
                }
              }
            }
          }

          // Check if user already has this book
          const { data: existingUserBook } = await supabase
            .from('user_books')
            .select('id')
            .eq('user_id', userId)
            .eq('book_id', bookId)
            .maybeSingle();

          if (existingUserBook) {
            result.skipped++;
            return;
          }

          // Add to user's library
          const status = mapShelfToStatus(bookshelf);
          const rating = convertRating(myRating);

          const { error: userBookError } = await supabase
            .from('user_books')
            .insert({
              user_id: userId,
              book_id: bookId,
              status,
              rating,
              started_at: status === 'reading' ? (dateAdded || new Date().toISOString().split('T')[0]) : null,
              finished_at: status === 'read' ? dateRead : null,
            });

          if (userBookError) {
            console.error('Error adding user_book:', userBookError);
            result.errors.push(`Error adding "${title}" to library: ${userBookError.message}`);
            return;
          }

          result.imported++;
        } catch (err) {
          console.error('Error processing row:', err);
          const message = err instanceof Error ? err.message : 'Unknown error';
          result.errors.push(`Error processing book: ${message}`);
        }
      }));
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log('Import complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to import" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
