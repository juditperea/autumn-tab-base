import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { Book } from "@/hooks/useBooks";
import type { ReadingStatus } from "@/hooks/useUserBooks";

interface BookCardProps {
  book: Book;
  userStatus?: ReadingStatus | null;
  userRating?: number | null;
  compact?: boolean;
}

const statusLabels: Record<ReadingStatus, string> = {
  to_read: "Por leer",
  reading: "Leyendo",
  read: "Leído",
  dnf: "Abandonado",
};

const statusColors: Record<ReadingStatus, string> = {
  to_read: "bg-secondary text-secondary-foreground",
  reading: "bg-primary text-primary-foreground",
  read: "bg-accent text-accent-foreground",
  dnf: "bg-muted text-muted-foreground",
};

export const BookCard = ({ book, userStatus, userRating, compact = false }: BookCardProps) => {
  if (compact) {
    return (
      <Link to={`/libro/${book.id}`}>
        <Card className="p-3 shadow-card hover:shadow-warm tab-transition cursor-pointer">
          <div className="flex gap-3">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-12 h-16 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-16 rounded-md gradient-autumn flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">{book.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {book.authors.join(", ")}
              </p>
              {book.average_rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-accent text-accent" />
                  <span className="text-xs text-foreground">{book.average_rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/libro/${book.id}`}>
      <Card className="p-4 shadow-card hover:shadow-warm tab-transition cursor-pointer">
        <div className="flex gap-4">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-20 h-28 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-28 rounded-lg gradient-autumn flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{book.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {book.authors.join(", ")}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {book.genres.slice(0, 2).map((genre) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              {book.average_rating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {book.average_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({book.ratings_count})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Sin puntuaciones</span>
              )}

              {userStatus && (
                <Badge className={statusColors[userStatus]}>
                  {statusLabels[userStatus]}
                </Badge>
              )}
            </div>

            {userRating && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-muted-foreground">Tu puntuación:</span>
                <span className="text-sm font-medium text-primary">{userRating}/10</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
