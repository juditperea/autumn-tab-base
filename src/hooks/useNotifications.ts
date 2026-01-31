import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  type: "review_like" | "review_comment" | "activity_like" | "activity_comment";
  actor: {
    id: string;
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  target: {
    id: string;
    type: "review" | "activity";
    book_title?: string;
    book_id?: string;
    activity_type?: string;
    content_preview?: string;
  };
  created_at: string;
}

export const useNotifications = (limit = 50) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", user?.id, limit],
    queryFn: async (): Promise<Notification[]> => {
      if (!user?.id) return [];

      const notifications: Notification[] = [];

      // 1. Get likes on my reviews
      const { data: reviewLikes } = await supabase
        .from("review_votes")
        .select(`
          id,
          created_at,
          vote,
          review_id,
          user_id,
          actor:profiles!review_votes_user_id_fkey(id, username, avatar_url, full_name)
        `)
        .eq("vote", 1)
        .order("created_at", { ascending: false })
        .limit(limit);

      // Filter to only reviews that belong to current user
      if (reviewLikes) {
        for (const like of reviewLikes) {
          if (like.user_id === user.id) continue; // Skip own likes

          const { data: review } = await supabase
            .from("reviews")
            .select("id, user_id, book:books(id, title)")
            .eq("id", like.review_id)
            .single();

          if (review?.user_id === user.id) {
            notifications.push({
              id: `review_like_${like.id}`,
              type: "review_like",
              actor: like.actor as Notification["actor"],
              target: {
                id: review.id,
                type: "review",
                book_title: (review.book as { title: string })?.title,
                book_id: (review.book as { id: string })?.id,
              },
              created_at: like.created_at,
            });
          }
        }
      }

      // 2. Get comments on my reviews
      const { data: reviewComments } = await supabase
        .from("review_comments")
        .select(`
          id,
          created_at,
          content,
          review_id,
          user_id,
          actor:profiles!review_comments_user_id_fkey(id, username, avatar_url, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (reviewComments) {
        for (const comment of reviewComments) {
          if (comment.user_id === user.id) continue; // Skip own comments

          const { data: review } = await supabase
            .from("reviews")
            .select("id, user_id, book:books(id, title)")
            .eq("id", comment.review_id)
            .single();

          if (review?.user_id === user.id) {
            notifications.push({
              id: `review_comment_${comment.id}`,
              type: "review_comment",
              actor: comment.actor as Notification["actor"],
              target: {
                id: review.id,
                type: "review",
                book_title: (review.book as { title: string })?.title,
                book_id: (review.book as { id: string })?.id,
                content_preview: comment.content.slice(0, 100),
              },
              created_at: comment.created_at,
            });
          }
        }
      }

      // 3. Get likes on my activities
      const { data: activityLikes } = await supabase
        .from("activity_likes")
        .select(`
          id,
          created_at,
          activity_id,
          user_id,
          actor:profiles!activity_likes_user_id_fkey(id, username, avatar_url, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (activityLikes) {
        for (const like of activityLikes) {
          if (like.user_id === user.id) continue; // Skip own likes

          const { data: activity } = await supabase
            .from("activities")
            .select("id, user_id, activity_type, book:books(id, title)")
            .eq("id", like.activity_id)
            .single();

          if (activity?.user_id === user.id) {
            notifications.push({
              id: `activity_like_${like.id}`,
              type: "activity_like",
              actor: like.actor as Notification["actor"],
              target: {
                id: activity.id,
                type: "activity",
                activity_type: activity.activity_type,
                book_title: (activity.book as { title: string })?.title,
                book_id: (activity.book as { id: string })?.id,
              },
              created_at: like.created_at,
            });
          }
        }
      }

      // 4. Get comments on my activities
      const { data: activityComments } = await supabase
        .from("activity_comments")
        .select(`
          id,
          created_at,
          content,
          activity_id,
          user_id,
          actor:profiles!activity_comments_user_id_fkey(id, username, avatar_url, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (activityComments) {
        for (const comment of activityComments) {
          if (comment.user_id === user.id) continue; // Skip own comments

          const { data: activity } = await supabase
            .from("activities")
            .select("id, user_id, activity_type, book:books(id, title)")
            .eq("id", comment.activity_id)
            .single();

          if (activity?.user_id === user.id) {
            notifications.push({
              id: `activity_comment_${comment.id}`,
              type: "activity_comment",
              actor: comment.actor as Notification["actor"],
              target: {
                id: activity.id,
                type: "activity",
                activity_type: activity.activity_type,
                book_title: (activity.book as { title: string })?.title,
                book_id: (activity.book as { id: string })?.id,
                content_preview: comment.content.slice(0, 100),
              },
              created_at: comment.created_at,
            });
          }
        }
      }

      // Sort all notifications by date
      return notifications.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
