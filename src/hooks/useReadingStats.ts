import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPrimaryGenre } from "@/lib/genreNormalizer";

export interface MonthlyStats {
  month: string;
  monthLabel: string;
  books: number;
  pages: number;
}

export interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

export interface ReadingStats {
  totalBooks: number;
  totalPages: number;
  averageRating: number;
  booksThisYear: number;
  pagesThisYear: number;
  monthlyStats: MonthlyStats[];
  genreStats: GenreStats[];
  topGenre: string | null;
  averageBooksPerMonth: number;
  currentStreak: number;
}

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

export const useReadingStats = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["readingStats", targetUserId],
    queryFn: async (): Promise<ReadingStats> => {
      if (!targetUserId) throw new Error("No user ID");

      // Fetch all read books with their data
      const { data: userBooks, error } = await supabase
        .from("user_books")
        .select(`
          *,
          book:books(id, title, authors, page_count, genres)
        `)
        .eq("user_id", targetUserId)
        .eq("status", "read");

      if (error) throw error;

      const books = userBooks || [];
      const currentYear = new Date().getFullYear();

      // Basic stats
      const totalBooks = books.length;
      const totalPages = books.reduce((sum, ub) => sum + (ub.book?.page_count || 0), 0);
      const ratingsSum = books.filter(ub => ub.rating).reduce((sum, ub) => sum + (ub.rating || 0), 0);
      const ratedBooksCount = books.filter(ub => ub.rating).length;
      const averageRating = ratedBooksCount > 0 ? Number((ratingsSum / ratedBooksCount).toFixed(1)) : 0;

      // Books this year
      const booksThisYear = books.filter(ub => {
        if (!ub.finished_at) return false;
        return new Date(ub.finished_at).getFullYear() === currentYear;
      });

      // Monthly stats for current year
      const monthlyMap = new Map<number, { books: number; pages: number }>();
      
      // Initialize all months
      for (let i = 0; i < 12; i++) {
        monthlyMap.set(i, { books: 0, pages: 0 });
      }

      booksThisYear.forEach(ub => {
        if (ub.finished_at) {
          const month = new Date(ub.finished_at).getMonth();
          const current = monthlyMap.get(month) || { books: 0, pages: 0 };
          monthlyMap.set(month, {
            books: current.books + 1,
            pages: current.pages + (ub.book?.page_count || 0),
          });
        }
      });

      const monthlyStats: MonthlyStats[] = Array.from(monthlyMap.entries()).map(([month, stats]) => ({
        month: `${currentYear}-${String(month + 1).padStart(2, "0")}`,
        monthLabel: MONTH_NAMES[month],
        books: stats.books,
        pages: stats.pages,
      }));

      // Genre stats (from all time) – 1 primary genre per book, normalized
      const genreCounts = new Map<string, number>();
      books.forEach(ub => {
        const primary = getPrimaryGenre(ub.book?.genres as string[] | null);
        genreCounts.set(primary, (genreCounts.get(primary) || 0) + 1);
      });

      const totalGenreCounts = Array.from(genreCounts.values()).reduce((a, b) => a + b, 0);

      // Top 8 genres (no "Otros" bucket), exclude books without genre
      const sorted = Array.from(genreCounts.entries())
        .filter(([genre]) => genre !== "Otros")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      const filteredTotal = sorted.reduce((sum, [, c]) => sum + c, 0);
      const genreStats: GenreStats[] = sorted.map(([genre, count]) => ({
        genre,
        count,
        percentage: filteredTotal > 0 ? Math.round((count / filteredTotal) * 100) : 0,
      }));

      const topGenre = genreStats.length > 0 ? genreStats[0].genre : null;

      // Average books per month (based on months with at least 1 book)
      const monthsWithBooks = monthlyStats.filter(m => m.books > 0).length;
      const averageBooksPerMonth = monthsWithBooks > 0 
        ? Number((booksThisYear.length / monthsWithBooks).toFixed(1)) 
        : 0;

      // Calculate reading streak (consecutive months with at least 1 book)
      let currentStreak = 0;
      const currentMonth = new Date().getMonth();
      for (let i = currentMonth; i >= 0; i--) {
        if (monthlyStats[i]?.books > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        totalBooks,
        totalPages,
        averageRating,
        booksThisYear: booksThisYear.length,
        pagesThisYear: booksThisYear.reduce((sum, ub) => sum + (ub.book?.page_count || 0), 0),
        monthlyStats,
        genreStats,
        topGenre,
        averageBooksPerMonth,
        currentStreak,
      };
    },
    enabled: !!targetUserId,
  });
};
