import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  content: string;
  contains_spoiler: boolean;
  language: string;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: {
    username: string;
    avatar_url: string | null;
  };
  book?: {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
  };
  user_book?: {
    rating: number | null;
  };
  votes_count?: number;
  user_vote?: number | null;
}

export const useBookReviews = (bookId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reviews", "book", bookId],
    queryFn: async () => {
      if (!bookId) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get ratings for each reviewer
      const reviewsWithRatings = await Promise.all(
        data.map(async (review) => {
          const { data: userBook } = await supabase
            .from("user_books")
            .select("rating")
            .eq("user_id", review.user_id)
            .eq("book_id", bookId)
            .maybeSingle();

          // Get votes count
          const { count: upvotes } = await supabase
            .from("review_votes")
            .select("*", { count: "exact", head: true })
            .eq("review_id", review.id)
            .eq("vote", 1);

          const { count: downvotes } = await supabase
            .from("review_votes")
            .select("*", { count: "exact", head: true })
            .eq("review_id", review.id)
            .eq("vote", -1);

          // Get current user's vote
          let userVote = null;
          if (user?.id) {
            const { data: vote } = await supabase
              .from("review_votes")
              .select("vote")
              .eq("review_id", review.id)
              .eq("user_id", user.id)
              .maybeSingle();
            userVote = vote?.vote ?? null;
          }

          return {
            ...review,
            user_book: userBook,
            votes_count: (upvotes ?? 0) - (downvotes ?? 0),
            user_vote: userVote,
          };
        })
      );

      return reviewsWithRatings as Review[];
    },
    enabled: !!bookId,
  });
};

export const useUserReviews = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["reviews", "user", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          book:books(id, title, authors, cover_url)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!userId,
  });
};

export const useRecentReviews = (limit: number = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reviews", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profile:profiles(username, avatar_url),
          book:books(id, title, authors, cover_url)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get ratings for each review
      const reviewsWithRatings = await Promise.all(
        data.map(async (review) => {
          const { data: userBook } = await supabase
            .from("user_books")
            .select("rating")
            .eq("user_id", review.user_id)
            .eq("book_id", review.book_id)
            .maybeSingle();

          return {
            ...review,
            user_book: userBook,
          };
        })
      );

      return reviewsWithRatings as Review[];
    },
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      bookId,
      content,
      containsSpoiler = false,
      language = "es",
    }: {
      bookId: string;
      content: string;
      containsSpoiler?: boolean;
      language?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          book_id: bookId,
          content,
          contains_spoiler: containsSpoiler,
          language,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "book", bookId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "user"] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "recent"] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      containsSpoiler,
    }: {
      id: string;
      content?: string;
      containsSpoiler?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (content !== undefined) updates.content = content;
      if (containsSpoiler !== undefined) updates.contains_spoiler = containsSpoiler;

      const { data, error } = await supabase
        .from("reviews")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};

export const useVoteReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reviewId,
      vote,
    }: {
      reviewId: string;
      vote: 1 | -1 | null;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (vote === null) {
        // Remove vote
        const { error } = await supabase
          .from("review_votes")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", user.id);

        if (error) throw error;
        return null;
      }

      // Upsert vote
      const { data, error } = await supabase
        .from("review_votes")
        .upsert({
          user_id: user.id,
          review_id: reviewId,
          vote,
        }, {
          onConflict: "user_id,review_id",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};
