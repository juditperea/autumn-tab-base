import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookData {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Validate JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth to validate token
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", claimsData.claims.sub);
    
    // Use service role to bypass RLS for inserting books
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const book: BookData = await req.json();
    
    if (!book.title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize ISBNs
    const isbn10 = book.isbn10?.replace(/-/g, "") || null;
    const isbn13 = book.isbn13?.replace(/-/g, "") || null;

    // Check if book already exists by ISBN
    let existingBook = null;
    
    if (isbn13) {
      const { data } = await supabase
        .from("books")
        .select("id")
        .eq("isbn13", isbn13)
        .maybeSingle();
      existingBook = data;
    }
    
    if (!existingBook && isbn10) {
      const { data } = await supabase
        .from("books")
        .select("id")
        .eq("isbn10", isbn10)
        .maybeSingle();
      existingBook = data;
    }

    // If not found by ISBN, check by title + authors
    if (!existingBook) {
      const { data } = await supabase
        .from("books")
        .select("id")
        .eq("title", book.title)
        .contains("authors", book.authors)
        .maybeSingle();
      existingBook = data;
    }

    if (existingBook) {
      return new Response(
        JSON.stringify({ id: existingBook.id, existing: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new book
    const { data: newBook, error } = await supabase
      .from("books")
      .insert({
        title: book.title,
        authors: book.authors,
        description: book.description,
        cover_url: book.cover_url,
        isbn10,
        isbn13,
        genres: book.genres || [],
        language: book.language,
        page_count: book.page_count,
        published_year: book.published_year,
        source: book.source,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to add book" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ id: newBook.id, existing: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Add book error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to add book" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
