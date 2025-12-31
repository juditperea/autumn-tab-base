import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

export const useReviewComments = (reviewId: string | undefined) => {
  return useQuery({
    queryKey: ["review-comments", reviewId],
    queryFn: async () => {
      if (!reviewId) throw new Error("Review ID is required");

      const { data, error } = await supabase
        .from("review_comments")
        .select(`
          *,
          profile:profiles!review_comments_user_id_fkey (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ReviewComment[];
    },
    enabled: !!reviewId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, content }: { reviewId: string; content: string }) => {
      if (!user) throw new Error("User must be authenticated");

      const { data, error } = await supabase
        .from("review_comments")
        .insert({
          review_id: reviewId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ["review-comments", reviewId] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, reviewId }: { commentId: string; reviewId: string }) => {
      const { error } = await supabase
        .from("review_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return { commentId, reviewId };
    },
    onSuccess: (_, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: ["review-comments", reviewId] });
    },
  });
};
