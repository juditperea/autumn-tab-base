import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollow, useFollowStats } from '@/hooks/useFollows';
import { useAuth } from '@/contexts/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export const FollowButton = ({ 
  targetUserId, 
  variant = 'default',
  size = 'sm',
  showIcon = true 
}: FollowButtonProps) => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useFollowStats(targetUserId);
  const { follow, unfollow, isFollowLoading, isUnfollowLoading } = useFollow();

  // Don't show button if viewing own profile or not logged in
  if (!user || user.id === targetUserId) {
    return null;
  }

  const isLoading = statsLoading || isFollowLoading || isUnfollowLoading;
  const isFollowing = stats?.isFollowing || false;

  const handleClick = () => {
    if (isFollowing) {
      unfollow(targetUserId);
    } else {
      follow(targetUserId);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={isFollowing ? 'hover:bg-destructive hover:text-destructive-foreground hover:border-destructive' : ''}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (isFollowing ? <UserMinus className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />)}
          {isFollowing ? 'Dejar de seguir' : 'Seguir'}
        </>
      )}
    </Button>
  );
};
