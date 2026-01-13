import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalBook } from "./useExternalBooks";

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

// Get user's preferred language from browser
function getUserLanguage(): string {
  const browserLang = navigator.language || (navigator as unknown as { userLanguage: string }).userLanguage || "es";
  return browserLang.substring(0, 2);
}

// Curated collection definitions with specific search terms that return good results
export const CURATED_COLLECTIONS = [
  {
    id: "classics",
    title: "Clásicos modernos",
    description: "Obras atemporales que definieron la literatura",
    searchTerms: ["Cien años de soledad", "1984", "El principito"],
  },
  {
    id: "popular",
    title: "Los más leídos",
    description: "Libros populares en todo el mundo",
    searchTerms: ["Harry Potter", "El código Da Vinci", "Los juegos del hambre"],
  },
  {
    id: "awards",
    title: "Premios literarios",
    description: "Ganadores de premios internacionales",
    searchTerms: ["La sombra del viento", "Rayuela", "Pedro Páramo"],
  },
];

async function fetchCollectionBooks(searchTerms: string[]): Promise<ExternalBook[]> {
  const userLanguage = getUserLanguage();
  
  // Fetch books for each search term in parallel
  const promises = searchTerms.map(async (term) => {
    try {
      const { data, error } = await supabase.functions.invoke<SearchResult>("search-books", {
        body: {
          query: term,
          language: userLanguage === "es" ? "es" : undefined,
          userLanguage,
        },
      });

      if (error || !data?.results) {
        return [];
      }

      // Return only the first result (most relevant) for each search term
      return data.results.slice(0, 1);
    } catch {
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
}

export const useCuratedCollection = (collectionId: string) => {
  const collection = CURATED_COLLECTIONS.find((c) => c.id === collectionId);

  return useQuery({
    queryKey: ["curated-collection", collectionId],
    queryFn: async () => {
      if (!collection) return [];
      return fetchCollectionBooks(collection.searchTerms);
    },
    enabled: !!collection,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });
};

export const useAllCuratedCollections = () => {
  return useQuery({
    queryKey: ["curated-collections-all"],
    queryFn: async () => {
      const allCollections = await Promise.all(
        CURATED_COLLECTIONS.map(async (collection) => ({
          ...collection,
          books: await fetchCollectionBooks(collection.searchTerms),
        }))
      );
      return allCollections;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
  });
};
