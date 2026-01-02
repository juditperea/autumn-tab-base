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

export interface SearchFilters {
  author?: string;
  genre?: string;
  yearMin?: number;
  yearMax?: number;
  language?: string;
}

interface SearchResult {
  results: ExternalBook[];
  meta?: {
    total: number;
    sources: {
      google_books: number;
      open_library: number;
    };
  };
}

interface AddBookResult {
  id: string;
  existing: boolean;
}

// Get user's preferred language from browser
function getUserLanguage(): string {
  const browserLang = navigator.language || (navigator as any).userLanguage || "es";
  return browserLang.substring(0, 2);
}

export const useExternalBookSearch = () => {
  const [results, setResults] = useState<ExternalBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SearchResult["meta"] | null>(null);

  const search = async (query: string, filters?: SearchFilters) => {
    if (!query.trim()) {
      setResults([]);
      setMeta(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<SearchResult>("search-books", {
        body: { 
          query,
          author: filters?.author,
          genre: filters?.genre,
          yearMin: filters?.yearMin,
          yearMax: filters?.yearMax,
          language: filters?.language,
          userLanguage: getUserLanguage(),
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setResults(data?.results || []);
      setMeta(data?.meta || null);
    } catch (err) {
      console.error("External search error:", err);
      setError("Error buscando libros externos");
      setResults([]);
      setMeta(null);
    } finally {
      setIsSearching(false);
    }
  };

  const searchByISBN = async (isbn: string) => {
    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<SearchResult>("search-books", {
        body: { 
          isbn,
          userLanguage: getUserLanguage(),
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setResults(data?.results || []);
      setMeta(data?.meta || null);
    } catch (err) {
      console.error("ISBN search error:", err);
      setError("Error buscando por ISBN");
      setResults([]);
      setMeta(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
    setMeta(null);
  };

  return {
    results,
    isSearching,
    error,
    meta,
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
