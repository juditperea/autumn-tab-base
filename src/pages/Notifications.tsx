import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Heart, MessageSquare, BookOpen, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const getActivityTypeLabel = (type: string) => {
  switch (type) {
    case "rated_book":
      return "calificación";
    case "reviewed_book":
      return "reseña";
    case "started_reading":
      return "lectura";
    case "finished_book":
      return "libro terminado";
    case "joined_club":
      return "club";
    default:
      return "actividad";
  }
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const getIcon = () => {
    if (notification.type.includes("like")) {
      return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
    }
    return <MessageSquare className="w-4 h-4 text-primary" />;
  };

  const getMessage = () => {
    const actor = notification.actor.full_name || `@${notification.actor.username}`;
    const book = notification.target.book_title;

    switch (notification.type) {
      case "review_like":
        return (
          <>
            <strong>{actor}</strong> le gustó tu reseña de{" "}
            <strong>{book}</strong>
          </>
        );
      case "review_comment":
        return (
          <>
            <strong>{actor}</strong> comentó en tu reseña de{" "}
            <strong>{book}</strong>
            {notification.target.content_preview && (
              <span className="block text-muted-foreground text-sm mt-1 italic">
                "{notification.target.content_preview}"
              </span>
            )}
          </>
        );
      case "activity_like":
        return (
          <>
            <strong>{actor}</strong> le gustó tu{" "}
            {getActivityTypeLabel(notification.target.activity_type || "")}
            {book && (
              <>
                {" "}de <strong>{book}</strong>
              </>
            )}
          </>
        );
      case "activity_comment":
        return (
          <>
            <strong>{actor}</strong> comentó en tu{" "}
            {getActivityTypeLabel(notification.target.activity_type || "")}
            {book && (
              <>
                {" "}de <strong>{book}</strong>
              </>
            )}
            {notification.target.content_preview && (
              <span className="block text-muted-foreground text-sm mt-1 italic">
                "{notification.target.content_preview}"
              </span>
            )}
          </>
        );
      default:
        return null;
    }
  };

  const getLink = () => {
    if (notification.target.book_id) {
      return `/libro/${notification.target.book_id}`;
    }
    return "#";
  };

  return (
    <Link to={getLink()}>
      <Card className={cn(
        "p-4 hover:bg-muted/50 transition-colors",
      )}>
        <div className="flex gap-3">
          <Link to={`/perfil/${notification.actor.username}`} onClick={(e) => e.stopPropagation()}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={notification.actor.avatar_url ?? undefined} />
              <AvatarFallback className="gradient-autumn text-white">
                {notification.actor.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="mt-1">{getIcon()}</div>
              <p className="text-sm text-foreground flex-1">{getMessage()}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const Notifications = () => {
  const { data: notifications, isLoading } = useNotifications();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-bold gradient-text">Actividad</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="p-4 space-y-3 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        ) : (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">
              Sin notificaciones
            </h3>
            <p className="text-sm text-muted-foreground">
              Cuando alguien interactúe con tus reseñas o actividades, lo verás aquí.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Notifications;
