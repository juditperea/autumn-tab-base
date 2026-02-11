import { Card } from "@/components/ui/card";
import { BookOpen, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserBooks } from "@/hooks/useUserBooks";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface RecentActivityProps {
  limit?: number;
}

export const RecentActivity = ({ limit = 5 }: RecentActivityProps) => {
  const { t, i18n } = useTranslation();
  const { data: userBooks, isLoading } = useUserBooks();
  const dateLocale = i18n.language.startsWith("en") ? enUS : es;

  const recentBooks = userBooks
    ?.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!recentBooks || recentBooks.length === 0) {
    return (
      <Card className="p-6 text-center">
        <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t("activity.noActivity")}
        </p>
      </Card>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "reading": return t("status.reading");
      case "to_read": return t("activity.addedToRead");
      case "read": return t("activity.markedAsRead");
      case "dnf": return t("activity.notFinished");
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reading": return "text-primary";
      case "read": return "text-secondary";
      case "to_read": return "text-accent";
      case "dnf": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  return (
    <div className="space-y-2">
      {recentBooks.map((userBook) => (
        <Link
          key={userBook.id}
          to={`/libro/${userBook.book?.id}`}
          className="block"
        >
          <Card className="p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {userBook.book?.cover_url ? (
                <img
                  src={userBook.book.cover_url}
                  alt={userBook.book.title}
                  className="w-10 h-14 rounded object-cover shadow-sm"
                />
              ) : (
                <div className="w-10 h-14 rounded gradient-autumn flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {userBook.book?.title}
                </p>
                <p className={`text-xs ${getStatusColor(userBook.status)}`}>
                  {getStatusLabel(userBook.status)}
                  {userBook.rating && (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-accent text-accent" />
                      {userBook.rating}/10
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(userBook.updated_at), { 
                    addSuffix: true,
                    locale: dateLocale 
                  })}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};
