import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "reading" | "social" | "explorer" | "streak" | "special";
  unlocked: boolean;
  progress?: number;
  target?: number;
  unlockedAt?: string;
}

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: Achievement["category"];
  check: (stats: UserStats) => { unlocked: boolean; progress?: number; target?: number };
}

interface UserStats {
  totalBooksRead: number;
  booksThisYear: number;
  totalReviews: number;
  totalPagesRead: number;
  genresRead: string[];
  uniqueGenresCount: number;
  followersCount: number;
  followingCount: number;
  consecutiveMonths: number;
  averageRating: number;
  hasCompletedGoal: boolean;
  finishedDates: string[];
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Reading achievements
  {
    id: "first_book",
    name: "Primer paso",
    description: "Marca tu primer libro como leído",
    icon: "📖",
    category: "reading",
    check: (s) => ({ unlocked: s.totalBooksRead >= 1, progress: s.totalBooksRead, target: 1 }),
  },
  {
    id: "bookworm_10",
    name: "Ratón de biblioteca",
    description: "Lee 10 libros",
    icon: "📚",
    category: "reading",
    check: (s) => ({ unlocked: s.totalBooksRead >= 10, progress: s.totalBooksRead, target: 10 }),
  },
  {
    id: "bookworm_25",
    name: "Lector voraz",
    description: "Lee 25 libros",
    icon: "🐛",
    category: "reading",
    check: (s) => ({ unlocked: s.totalBooksRead >= 25, progress: s.totalBooksRead, target: 25 }),
  },
  {
    id: "bookworm_50",
    name: "Devorador de libros",
    description: "Lee 50 libros",
    icon: "🦋",
    category: "reading",
    check: (s) => ({ unlocked: s.totalBooksRead >= 50, progress: s.totalBooksRead, target: 50 }),
  },
  {
    id: "bookworm_100",
    name: "Centenario",
    description: "Lee 100 libros",
    icon: "👑",
    category: "reading",
    check: (s) => ({ unlocked: s.totalBooksRead >= 100, progress: s.totalBooksRead, target: 100 }),
  },
  {
    id: "page_turner_1000",
    name: "Mil páginas",
    description: "Lee 1,000 páginas en total",
    icon: "📄",
    category: "reading",
    check: (s) => ({ unlocked: s.totalPagesRead >= 1000, progress: s.totalPagesRead, target: 1000 }),
  },
  {
    id: "page_turner_10000",
    name: "Maratón literario",
    description: "Lee 10,000 páginas en total",
    icon: "🏃",
    category: "reading",
    check: (s) => ({ unlocked: s.totalPagesRead >= 10000, progress: s.totalPagesRead, target: 10000 }),
  },

  // Explorer achievements (genres)
  {
    id: "explorer_3",
    name: "Curioso",
    description: "Lee libros de 3 géneros diferentes",
    icon: "🔍",
    category: "explorer",
    check: (s) => ({ unlocked: s.uniqueGenresCount >= 3, progress: s.uniqueGenresCount, target: 3 }),
  },
  {
    id: "explorer_5",
    name: "Aventurero",
    description: "Lee libros de 5 géneros diferentes",
    icon: "🧭",
    category: "explorer",
    check: (s) => ({ unlocked: s.uniqueGenresCount >= 5, progress: s.uniqueGenresCount, target: 5 }),
  },
  {
    id: "explorer_10",
    name: "Explorador maestro",
    description: "Lee libros de 10 géneros diferentes",
    icon: "🗺️",
    category: "explorer",
    check: (s) => ({ unlocked: s.uniqueGenresCount >= 10, progress: s.uniqueGenresCount, target: 10 }),
  },

  // Social achievements
  {
    id: "reviewer_1",
    name: "Crítico novato",
    description: "Escribe tu primera reseña",
    icon: "✍️",
    category: "social",
    check: (s) => ({ unlocked: s.totalReviews >= 1, progress: s.totalReviews, target: 1 }),
  },
  {
    id: "reviewer_5",
    name: "Reseñador activo",
    description: "Escribe 5 reseñas",
    icon: "📝",
    category: "social",
    check: (s) => ({ unlocked: s.totalReviews >= 5, progress: s.totalReviews, target: 5 }),
  },
  {
    id: "reviewer_20",
    name: "Crítico experto",
    description: "Escribe 20 reseñas",
    icon: "🎭",
    category: "social",
    check: (s) => ({ unlocked: s.totalReviews >= 20, progress: s.totalReviews, target: 20 }),
  },
  {
    id: "popular_10",
    name: "Influencer literario",
    description: "Consigue 10 seguidores",
    icon: "⭐",
    category: "social",
    check: (s) => ({ unlocked: s.followersCount >= 10, progress: s.followersCount, target: 10 }),
  },

  // Streak achievements
  {
    id: "streak_2",
    name: "Constante",
    description: "Lee al menos 1 libro 2 meses seguidos",
    icon: "🔥",
    category: "streak",
    check: (s) => ({ unlocked: s.consecutiveMonths >= 2, progress: s.consecutiveMonths, target: 2 }),
  },
  {
    id: "streak_6",
    name: "Imparable",
    description: "Lee al menos 1 libro 6 meses seguidos",
    icon: "💪",
    category: "streak",
    check: (s) => ({ unlocked: s.consecutiveMonths >= 6, progress: s.consecutiveMonths, target: 6 }),
  },
  {
    id: "streak_12",
    name: "Leyenda",
    description: "Lee al menos 1 libro 12 meses seguidos",
    icon: "🏆",
    category: "streak",
    check: (s) => ({ unlocked: s.consecutiveMonths >= 12, progress: s.consecutiveMonths, target: 12 }),
  },

  // Special achievements
  {
    id: "goal_complete",
    name: "Objetivo cumplido",
    description: "Completa tu desafío de lectura anual",
    icon: "🎯",
    category: "special",
    check: (s) => ({ unlocked: s.hasCompletedGoal }),
  },
  {
    id: "year_10",
    name: "Año productivo",
    description: "Lee 10 libros en un año",
    icon: "📅",
    category: "special",
    check: (s) => ({ unlocked: s.booksThisYear >= 10, progress: s.booksThisYear, target: 10 }),
  },
  {
    id: "year_25",
    name: "Año épico",
    description: "Lee 25 libros en un año",
    icon: "🌟",
    category: "special",
    check: (s) => ({ unlocked: s.booksThisYear >= 25, progress: s.booksThisYear, target: 25 }),
  },
];

export const useAchievements = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ["achievements", targetUserId],
    queryFn: async (): Promise<Achievement[]> => {
      if (!targetUserId) throw new Error("No user ID");

      // Fetch all necessary data in parallel
      const [userBooksResult, reviewsResult, followersResult, followingResult, profileResult] = await Promise.all([
        supabase
          .from("user_books")
          .select("*, book:books(genres, page_count)")
          .eq("user_id", targetUserId)
          .eq("status", "read"),
        supabase
          .from("reviews")
          .select("id")
          .eq("user_id", targetUserId),
        supabase
          .from("follows")
          .select("id")
          .eq("following_id", targetUserId),
        supabase
          .from("follows")
          .select("id")
          .eq("follower_id", targetUserId),
        supabase
          .from("profiles")
          .select("reading_goal, reading_goal_year")
          .eq("id", targetUserId)
          .maybeSingle(),
      ]);

      const userBooks = userBooksResult.data || [];
      const reviews = reviewsResult.data || [];
      const followers = followersResult.data || [];
      const following = followingResult.data || [];
      const profile = profileResult.data;

      // Calculate stats
      const currentYear = new Date().getFullYear();
      const booksThisYear = userBooks.filter(ub => {
        if (!ub.finished_at) return false;
        return new Date(ub.finished_at).getFullYear() === currentYear;
      });

      // Collect all genres
      const allGenres = new Set<string>();
      userBooks.forEach(ub => {
        const genres = ub.book?.genres || [];
        genres.forEach((g: string) => allGenres.add(g.toLowerCase()));
      });

      // Calculate consecutive months
      const finishedDates = userBooks
        .filter(ub => ub.finished_at)
        .map(ub => ub.finished_at as string);

      const monthsWithBooks = new Set<string>();
      finishedDates.forEach(date => {
        const d = new Date(date);
        monthsWithBooks.add(`${d.getFullYear()}-${d.getMonth()}`);
      });

      // Calculate streak from current month backwards
      let consecutiveMonths = 0;
      const now = new Date();
      let checkYear = now.getFullYear();
      let checkMonth = now.getMonth();

      while (true) {
        const key = `${checkYear}-${checkMonth}`;
        if (monthsWithBooks.has(key)) {
          consecutiveMonths++;
          checkMonth--;
          if (checkMonth < 0) {
            checkMonth = 11;
            checkYear--;
          }
        } else {
          break;
        }
        if (consecutiveMonths > 24) break; // Safety limit
      }

      // Check if reading goal completed
      const hasCompletedGoal = 
        profile?.reading_goal_year === currentYear &&
        profile?.reading_goal !== null &&
        booksThisYear.length >= (profile?.reading_goal || 0);

      // Total pages
      const totalPagesRead = userBooks.reduce((sum, ub) => sum + (ub.book?.page_count || 0), 0);

      // Calculate average rating
      const ratingsSum = userBooks.filter(ub => ub.rating).reduce((sum, ub) => sum + (ub.rating || 0), 0);
      const ratedCount = userBooks.filter(ub => ub.rating).length;
      const averageRating = ratedCount > 0 ? ratingsSum / ratedCount : 0;

      const stats: UserStats = {
        totalBooksRead: userBooks.length,
        booksThisYear: booksThisYear.length,
        totalReviews: reviews.length,
        totalPagesRead,
        genresRead: Array.from(allGenres),
        uniqueGenresCount: allGenres.size,
        followersCount: followers.length,
        followingCount: following.length,
        consecutiveMonths,
        averageRating,
        hasCompletedGoal,
        finishedDates,
      };

      // Evaluate all achievements
      return ACHIEVEMENT_DEFINITIONS.map(def => {
        const result = def.check(stats);
        return {
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
          unlocked: result.unlocked,
          progress: result.progress,
          target: result.target,
        };
      });
    },
    enabled: !!targetUserId,
  });
};

export const useUnlockedAchievementsCount = (userId?: string) => {
  const { data: achievements } = useAchievements(userId);
  return achievements?.filter(a => a.unlocked).length ?? 0;
};
