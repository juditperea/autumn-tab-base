import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { Book } from "@/hooks/useBooks";
import type { ReadingStatus } from "@/hooks/useUserBooks";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBookForBook, useUpdateUserBook, useAddToShelf } from "@/hooks/useUserBooks";
import { QuickRating } from "./QuickRating";
import { useToast } from "@/hooks/use-toast";

interface BookCardProps {
  book: Book;
  userStatus?: ReadingStatus | null;
  userRating?: number | null;
  userBookId?: string;
  customCoverUrl?: string | null;
  compact?: boolean;
  showQuickRating?: boolean;
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

export const BookCard = ({ 
  book, 
  userStatus, 
  userRating, 
  userBookId,
  customCoverUrl,
  compact = false,
  showQuickRating = true,
}: BookCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const updateUserBook = useUpdateUserBook();
  const addToShelf = useAddToShelf();
  
  // If we have a userBookId, we can use it directly
  // Otherwise, we need to fetch the user's book data
  const { data: fetchedUserBook } = useUserBookForBook(
    showQuickRating && user && !userBookId ? book.id : undefined
  );
  
  const effectiveUserBookId = userBookId || fetchedUserBook?.id;
  const effectiveUserRating = userRating ?? fetchedUserBook?.rating ?? null;
  const effectiveCoverUrl = customCoverUrl || fetchedUserBook?.custom_cover_url || book.cover_url;

  const handleQuickRate = async (rating: number) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para puntuar libros",
      });
      return;
    }

    try {
      if (effectiveUserBookId) {
        // Update existing user book
        await updateUserBook.mutateAsync({ id: effectiveUserBookId, rating });
      } else {
        // Add to shelf with rating (status: read by default when rating)
        await addToShelf.mutateAsync({ bookId: book.id, status: "read", rating });
      }
      toast({
        title: "Puntuación guardada",
        description: `Has puntuado "${book.title}" con ${rating}/10`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la puntuación",
      });
    }
  };

  if (compact) {
    return (
      <Link to={`/libro/${book.id}`}>
        <Card className="p-3 shadow-card hover:shadow-warm tab-transition cursor-pointer">
          <div className="flex gap-3">
            {effectiveCoverUrl ? (
              <img
                src={effectiveCoverUrl}
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
    <Card 
      className="p-4 shadow-card hover:shadow-warm tab-transition cursor-pointer"
      onClick={(e) => {
        // Don't navigate if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (
          target.closest('button') || 
          target.closest('[role="button"]') ||
          target.closest('[data-interactive="true"]')
        ) {
          return;
        }
        navigate(`/libro/${book.id}`);
      }}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {effectiveCoverUrl ? (
            <img
              src={effectiveCoverUrl}
              alt={book.title}
              className="w-20 h-28 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-28 rounded-lg gradient-autumn" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2 hover:text-primary transition-colors">
            {book.title}
          </h3>
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

          {/* Quick Rating - always show for logged in users */}
          {showQuickRating && user && (
            <div className="mt-2 pt-2 border-t border-border" data-interactive="true">
              <QuickRating
                bookId={book.id}
                currentRating={effectiveUserRating}
                onRate={handleQuickRate}
                size="sm"
              />
            </div>
          )}

          {/* Show user rating if quick rating is disabled but rating exists */}
          {!showQuickRating && effectiveUserRating && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">Tu puntuación:</span>
              <span className="text-sm font-medium text-primary">{effectiveUserRating}/10</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
