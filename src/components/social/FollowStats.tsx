import { useFollowStats } from '@/hooks/useFollows';
import { Users } from 'lucide-react';

interface FollowStatsProps {
  userId: string;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export const FollowStats = ({ userId, onFollowersClick, onFollowingClick }: FollowStatsProps) => {
  const { data: stats, isLoading } = useFollowStats(userId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="animate-pulse">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <button
        onClick={onFollowersClick}
        className="flex items-center gap-1 hover:text-primary transition-colors"
        disabled={!onFollowersClick}
      >
        <Users className="h-4 w-4" />
        <span className="font-semibold">{stats?.followersCount || 0}</span>
        <span className="text-muted-foreground">seguidores</span>
      </button>
      
      <button
        onClick={onFollowingClick}
        className="flex items-center gap-1 hover:text-primary transition-colors"
        disabled={!onFollowingClick}
      >
        <span className="font-semibold">{stats?.followingCount || 0}</span>
        <span className="text-muted-foreground">siguiendo</span>
      </button>
    </div>
  );
};
