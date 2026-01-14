import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export const useFollowStats = (userId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follow-stats', userId, user?.id],
    queryFn: async (): Promise<FollowStats> => {
      if (!userId) {
        return { followersCount: 0, followingCount: 0, isFollowing: false };
      }

      const [followersRes, followingRes, isFollowingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId),
        user?.id
          ? supabase
              .from('follows')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        followersCount: followersRes.count || 0,
        followingCount: followingRes.count || 0,
        isFollowing: !!isFollowingRes.data,
      };
    },
    enabled: !!userId,
  });
};

export const useFollow = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Must be logged in to follow');
      
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
      
      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-stats', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Must be logged in to unfollow');
      
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      
      if (error) throw error;
    },
    onSuccess: (_, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-stats', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowLoading: followMutation.isPending,
    isUnfollowLoading: unfollowMutation.isPending,
  };
};

export const useFollowers = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          created_at,
          follower:profiles!follows_follower_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useFollowing = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          created_at,
          following:profiles!follows_following_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};
