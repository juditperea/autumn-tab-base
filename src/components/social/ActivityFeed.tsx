import { useActivityFeed } from '@/hooks/useActivityFeed';
import { ActivityCard } from './ActivityCard';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ActivityFeedProps {
  limit?: number;
}

export const ActivityFeed = ({ limit = 20 }: ActivityFeedProps) => {
  const { t } = useTranslation();
  const { data: activities, isLoading, error } = useActivityFeed(limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {t('activity.feedError')}
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">{t('activity.feedEmpty')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('activity.feedEmptyDesc')}
          </p>
          <Button asChild>
            <Link to="/buscar-usuarios">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('activity.discoverReaders')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
};
