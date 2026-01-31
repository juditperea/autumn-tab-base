import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActivityComment {
  id: string;
  activity_id: string;
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

// Hook to get likes count and user's like status for an activity
export const useActivityLikes = (activityId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-likes", activityId, user?.id],
    queryFn: async () => {
      // Get likes count
      const { count } = await supabase
        .from("activity_likes")
        .select("*", { count: "exact", head: true })
        .eq("activity_id", activityId);

      // Check if current user liked
      let userLiked = false;
      if (user?.id) {
        const { data } = await supabase
          .from("activity_likes")
          .select("id")
          .eq("activity_id", activityId)
          .eq("user_id", user.id)
          .maybeSingle();
        userLiked = !!data;
      }

      return {
        count: count ?? 0,
        userLiked,
      };
    },
    enabled: !!activityId,
  });
};

// Hook to toggle like on an activity
export const useToggleActivityLike = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      activityId,
      isLiked,
    }: {
      activityId: string;
      isLiked: boolean;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from("activity_likes")
          .delete()
          .eq("activity_id", activityId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase.from("activity_likes").insert({
          activity_id: activityId,
          user_id: user.id,
        });

        if (error) throw error;
      }
    },
    onSuccess: (_, { activityId }) => {
      queryClient.invalidateQueries({ queryKey: ["activity-likes", activityId] });
    },
  });
};

// Hook to get comments for an activity
export const useActivityComments = (activityId: string) => {
  return useQuery({
    queryKey: ["activity-comments", activityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_comments")
        .select(`
          *,
          profile:profiles(username, avatar_url, full_name)
        `)
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ActivityComment[];
    },
    enabled: !!activityId,
  });
};

// Hook to add a comment to an activity
export const useAddActivityComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      activityId,
      content,
    }: {
      activityId: string;
      content: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("activity_comments")
        .insert({
          activity_id: activityId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { activityId }) => {
      queryClient.invalidateQueries({ queryKey: ["activity-comments", activityId] });
    },
  });
};

// Hook to delete a comment
export const useDeleteActivityComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("activity_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-comments"] });
    },
  });
};
