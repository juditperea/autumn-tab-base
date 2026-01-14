import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Activity {
  id: string;
  user_id: string;
  activity_type: 'rated_book' | 'reviewed_book' | 'started_reading' | 'finished_book' | 'joined_club';
  book_id: string | null;
  review_id: string | null;
  rating: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  book: {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
  } | null;
}

export const useActivityFeed = (limit = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['activity-feed', user?.id, limit],
    queryFn: async (): Promise<Activity[]> => {
      if (!user?.id) return [];

      // Get the list of users the current user follows
      const { data: following, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) throw followError;

      const followingIds = following?.map(f => f.following_id) || [];
      
      if (followingIds.length === 0) {
        return [];
      }

      // Get activities from followed users
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          user_id,
          activity_type,
          book_id,
          review_id,
          rating,
          metadata,
          created_at,
          user:profiles!activities_user_id_fkey(id, username, full_name, avatar_url),
          book:books(id, title, authors, cover_url)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []) as unknown as Activity[];
    },
    enabled: !!user?.id,
  });
};

export const useUserActivities = (userId: string | undefined, limit = 10) => {
  return useQuery({
    queryKey: ['user-activities', userId, limit],
    queryFn: async (): Promise<Activity[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          user_id,
          activity_type,
          book_id,
          review_id,
          rating,
          metadata,
          created_at,
          user:profiles!activities_user_id_fkey(id, username, full_name, avatar_url),
          book:books(id, title, authors, cover_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []) as unknown as Activity[];
    },
    enabled: !!userId,
  });
};
