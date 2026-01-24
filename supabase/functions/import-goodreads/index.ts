import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoodreadsBook {
  title: string;
  author: string;
  isbn: string;
  isbn13: string;
  myRating: number;
  averageRating: number;
  dateRead: string | null;
  dateAdded: string;
  bookshelf: string;
  numberOfPages: number | null;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
}

// Parse CSV content
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  // Parse header - handle quoted values
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  const results: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    
    results.push(row);
  }
  
  return results;
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Map Goodreads bookshelf to our status
function mapShelfToStatus(shelf: string): string {
  const shelfLower = shelf.toLowerCase();
  if (shelfLower === 'read') return 'read';
  if (shelfLower === 'currently-reading') return 'reading';
  if (shelfLower === 'to-read') return 'to_read';
  if (shelfLower === 'did-not-finish') return 'dnf';
  return 'to_read';
}

// Convert Goodreads rating (1-5) to our scale (1-10)
function convertRating(grRating: number): number | null {
  if (!grRating || grRating === 0) return null;
  // Convert 1-5 to 2-10 (multiply by 2)
  return Math.min(10, Math.max(1, grRating * 2));
}

// Parse Goodreads date format
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '') return null;
  
  // Goodreads uses format: YYYY/MM/DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

// Clean ISBN
function cleanISBN(isbn: string): string | null {
  if (!isbn) return null;
  // Remove quotes and equals sign that Goodreads adds
  const cleaned = isbn.replace(/[="']/g, '').trim();
  return cleaned || null;
}

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

    // Use service role for database operations
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
      errors: [],
    };

    for (const row of rows) {
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
          continue;
        }

        // Try to find existing book by ISBN
        let bookId: string | null = null;

        if (isbn13) {
          const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .eq('isbn13', isbn13)
            .maybeSingle();
          
          if (existingBook) {
            bookId = existingBook.id;
          }
        }

        if (!bookId && isbn) {
          const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .eq('isbn10', isbn)
            .maybeSingle();
          
          if (existingBook) {
            bookId = existingBook.id;
          }
        }

        // If not found by ISBN, try by title + author
        if (!bookId) {
          const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .ilike('title', title)
            .maybeSingle();
          
          if (existingBook) {
            bookId = existingBook.id;
          }
        }

        // If book doesn't exist, create it
        if (!bookId) {
          const { data: newBook, error: insertError } = await supabase
            .from('books')
            .insert({
              title,
              authors: author ? [author] : [],
              isbn10: isbn,
              isbn13: isbn13,
              page_count: numberOfPages,
              source: 'goodreads_import',
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('Error inserting book:', insertError);
            result.errors.push(`Error adding "${title}": ${insertError.message}`);
            continue;
          }

          bookId = newBook.id;
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
          continue;
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
          continue;
        }

        result.imported++;
      } catch (err) {
        console.error('Error processing row:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Error processing book: ${message}`);
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
