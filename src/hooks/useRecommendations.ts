import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReadingStats } from "./useReadingStats";

export interface RecommendedBook {
  id: string;
  title: string;
  authors: string[];
  cover_url: string | null;
  genres: string[] | null;
  average_rating: number | null;
  ratings_count: number | null;
  reason: string; // e.g. "Because you like Fantasy"
}

export const useRecommendations = (limit = 10) => {
  const { user } = useAuth();
  const { data: stats } = useReadingStats(user?.id);

  return useQuery({
    queryKey: ["recommendations", user?.id, stats?.topGenre],
    queryFn: async (): Promise<RecommendedBook[]> => {
      if (!user?.id || !stats) return [];

      // Get user's read book IDs to exclude them
      const { data: userBooks } = await supabase
        .from("user_books")
        .select("book_id")
        .eq("user_id", user.id);

      const readBookIds = new Set((userBooks || []).map((ub) => ub.book_id));

      // Get top 3 genres from stats
      const topGenres = stats.genreStats.slice(0, 3).map((g) => g.genre);

      if (topGenres.length === 0) {
        // Fallback: get highest-rated books the user hasn't read
        const { data: popularBooks } = await supabase
          .from("books")
          .select("id, title, authors, cover_url, genres, average_rating, ratings_count")
          .not("average_rating", "is", null)
          .order("average_rating", { ascending: false })
          .order("ratings_count", { ascending: false })
          .limit(limit + readBookIds.size);

        return (popularBooks || [])
          .filter((b) => !readBookIds.has(b.id))
          .slice(0, limit)
          .map((b) => ({ ...b, reason: "" }));
      }

      // Query books that match user's favorite genres, excluding already read
      const { data: candidateBooks } = await supabase
        .from("books")
        .select("id, title, authors, cover_url, genres, average_rating, ratings_count")
        .not("genres", "is", null)
        .order("average_rating", { ascending: false, nullsFirst: false })
        .limit(200);

      if (!candidateBooks) return [];

      // Score each book by genre overlap with user's preferences
      const scored = candidateBooks
        .filter((b) => !readBookIds.has(b.id))
        .map((b) => {
          const bookGenres = (b.genres || []).map((g: string) => g.toLowerCase());
          let score = 0;
          let matchedGenre = "";

          topGenres.forEach((userGenre, idx) => {
            const weight = 3 - idx; // top genre = 3, second = 2, third = 1
            if (bookGenres.some((bg: string) => bg.includes(userGenre.toLowerCase()) || userGenre.toLowerCase().includes(bg))) {
              score += weight;
              if (!matchedGenre) matchedGenre = userGenre;
            }
          });

          // Boost by rating
          if (b.average_rating) score += b.average_rating / 10;
          if (b.ratings_count && b.ratings_count > 5) score += 0.5;

          return { ...b, score, matchedGenre };
        })
        .filter((b) => b.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scored.map((b) => ({
        id: b.id,
        title: b.title,
        authors: b.authors,
        cover_url: b.cover_url,
        genres: b.genres,
        average_rating: b.average_rating,
        ratings_count: b.ratings_count,
        reason: b.matchedGenre,
      }));
    },
    enabled: !!user?.id && !!stats,
    staleTime: 1000 * 60 * 10, // 10 min cache
  });
};