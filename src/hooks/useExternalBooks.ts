import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExternalBook {
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

interface SearchResult {
  results: ExternalBook[];
}

interface AddBookResult {
  id: string;
  existing: boolean;
}

export const useExternalBookSearch = () => {
  const [results, setResults] = useState<ExternalBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<SearchResult>("search-books", {
        body: { query },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setResults(data?.results || []);
    } catch (err) {
      console.error("External search error:", err);
      setError("Error buscando libros externos");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const searchByISBN = async (isbn: string) => {
    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<SearchResult>("search-books", {
        body: { isbn },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setResults(data?.results || []);
    } catch (err) {
      console.error("ISBN search error:", err);
      setError("Error buscando por ISBN");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    results,
    isSearching,
    error,
    search,
    searchByISBN,
    clearResults,
  };
};

export const useAddExternalBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (book: ExternalBook): Promise<AddBookResult> => {
      const { data, error } = await supabase.functions.invoke<AddBookResult>("add-book", {
        body: book,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("No data returned");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
};
