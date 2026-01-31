import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userReviewsRef = useRef<Set<string>>(new Set());
  const userActivitiesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    // Fetch user's reviews and activities IDs for filtering
    const fetchUserContent = async () => {
      const [reviewsRes, activitiesRes] = await Promise.all([
        supabase.from("reviews").select("id").eq("user_id", user.id),
        supabase.from("activities").select("id").eq("user_id", user.id),
      ]);

      if (reviewsRes.data) {
        userReviewsRef.current = new Set(reviewsRes.data.map((r) => r.id));
      }
      if (activitiesRes.data) {
        userActivitiesRef.current = new Set(activitiesRes.data.map((a) => a.id));
      }
    };

    fetchUserContent();

    const channel = supabase
      .channel("user-notifications")
      // Review votes (likes on reviews)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "review_votes",
        },
        async (payload) => {
          const reviewId = payload.new.review_id;
          const voterId = payload.new.user_id;
          const vote = payload.new.vote;

          // Skip if it's own vote or not a like
          if (voterId === user.id || vote !== 1) return;

          // Check if it's on user's review
          if (userReviewsRef.current.has(reviewId)) {
            // Get voter info
            const { data: voter } = await supabase
              .from("profiles")
              .select("username, full_name")
              .eq("id", voterId)
              .single();

            const name = voter?.full_name || `@${voter?.username}` || "Alguien";
            toast("❤️ Nueva interacción", {
              description: `${name} le gustó tu reseña`,
            });

            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        }
      )
      // Review comments
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "review_comments",
        },
        async (payload) => {
          const reviewId = payload.new.review_id;
          const commenterId = payload.new.user_id;

          if (commenterId === user.id) return;

          if (userReviewsRef.current.has(reviewId)) {
            const { data: commenter } = await supabase
              .from("profiles")
              .select("username, full_name")
              .eq("id", commenterId)
              .single();

            const name = commenter?.full_name || `@${commenter?.username}` || "Alguien";
            toast("💬 Nuevo comentario", {
              description: `${name} comentó en tu reseña`,
            });

            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        }
      )
      // Activity likes
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_likes",
        },
        async (payload) => {
          const activityId = payload.new.activity_id;
          const likerId = payload.new.user_id;

          if (likerId === user.id) return;

          if (userActivitiesRef.current.has(activityId)) {
            const { data: liker } = await supabase
              .from("profiles")
              .select("username, full_name")
              .eq("id", likerId)
              .single();

            const name = liker?.full_name || `@${liker?.username}` || "Alguien";
            toast("❤️ Nueva interacción", {
              description: `${name} le gustó tu actividad`,
            });

            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        }
      )
      // Activity comments
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_comments",
        },
        async (payload) => {
          const activityId = payload.new.activity_id;
          const commenterId = payload.new.user_id;

          if (commenterId === user.id) return;

          if (userActivitiesRef.current.has(activityId)) {
            const { data: commenter } = await supabase
              .from("profiles")
              .select("username, full_name")
              .eq("id", commenterId)
              .single();

            const name = commenter?.full_name || `@${commenter?.username}` || "Alguien";
            toast("💬 Nuevo comentario", {
              description: `${name} comentó en tu actividad`,
            });

            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};
