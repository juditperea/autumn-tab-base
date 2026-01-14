import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen, MessageSquare, BookMarked, PartyPopper } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from '@/hooks/useActivityFeed';
import { Link } from 'react-router-dom';

interface ActivityCardProps {
  activity: Activity;
}

const getActivityIcon = (type: Activity['activity_type']) => {
  switch (type) {
    case 'rated_book':
      return <Star className="h-4 w-4 text-amber-500" />;
    case 'reviewed_book':
      return <MessageSquare className="h-4 w-4 text-primary" />;
    case 'started_reading':
      return <BookOpen className="h-4 w-4 text-blue-500" />;
    case 'finished_book':
      return <PartyPopper className="h-4 w-4 text-green-500" />;
    case 'joined_club':
      return <BookMarked className="h-4 w-4 text-purple-500" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
};

const getActivityText = (activity: Activity) => {
  const bookTitle = activity.book?.title || 'un libro';
  
  switch (activity.activity_type) {
    case 'rated_book':
      return (
        <>
          calificó <strong>{bookTitle}</strong> con{' '}
          <Badge variant="secondary" className="ml-1 text-amber-600">
            <Star className="h-3 w-3 mr-0.5 fill-amber-500 text-amber-500" />
            {activity.rating?.toFixed(1)}
          </Badge>
        </>
      );
    case 'reviewed_book':
      return (
        <>
          escribió una reseña de <strong>{bookTitle}</strong>
        </>
      );
    case 'started_reading':
      return (
        <>
          empezó a leer <strong>{bookTitle}</strong>
        </>
      );
    case 'finished_book':
      return (
        <>
          terminó de leer <strong>{bookTitle}</strong>
          {activity.rating && (
            <Badge variant="secondary" className="ml-1 text-amber-600">
              <Star className="h-3 w-3 mr-0.5 fill-amber-500 text-amber-500" />
              {activity.rating.toFixed(1)}
            </Badge>
          )}
        </>
      );
    case 'joined_club':
      return <>se unió a un club de lectura</>;
    default:
      return <>hizo algo con {bookTitle}</>;
  }
};

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Book cover */}
          {activity.book?.cover_url && (
            <Link to={`/libro/${activity.book.id}`} className="flex-shrink-0">
              <img
                src={activity.book.cover_url}
                alt={activity.book.title}
                className="w-12 h-18 object-cover rounded-sm shadow-sm hover:shadow-md transition-shadow"
              />
            </Link>
          )}
          
          <div className="flex-1 min-w-0">
            {/* User info and activity */}
            <div className="flex items-start gap-2">
              <Link to={`/perfil/${activity.user.username}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {activity.user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <Link 
                    to={`/perfil/${activity.user.username}`}
                    className="font-medium hover:underline"
                  >
                    {activity.user.full_name || activity.user.username}
                  </Link>{' '}
                  {getActivityText(activity)}
                </p>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {getActivityIcon(activity.activity_type)}
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
