import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string | null;
  cover_url: string | null;
  isbn10: string | null;
  isbn13: string | null;
  genres: string[];
  language: string;
  page_count: number | null;
  published_year: number | null;
  average_rating: number;
  ratings_count: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export const useBooks = () => {
  return useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("title");

      if (error) throw error;
      return data as Book[];
    },
  });
};

export const useBook = (id: string | undefined) => {
  return useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      if (!id) throw new Error("Book ID is required");
      
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Book not found");
      return data as Book;
    },
    enabled: !!id,
  });
};

export const useBooksByGenre = (genre: string | null) => {
  return useQuery({
    queryKey: ["books", "genre", genre],
    queryFn: async () => {
      if (!genre) {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .order("title");
        if (error) throw error;
        return data as Book[];
      }

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .contains("genres", [genre])
        .order("title");

      if (error) throw error;
      return data as Book[];
    },
    enabled: true,
  });
};

export const useSearchBooks = (query: string) => {
  return useQuery({
    queryKey: ["books", "search", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .or(`title.ilike.%${query}%,authors.cs.{${query}}`)
        .order("title")
        .limit(20);

      if (error) throw error;
      return data as Book[];
    },
    enabled: query.trim().length > 0,
  });
};
