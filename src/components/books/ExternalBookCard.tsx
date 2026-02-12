import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, BookOpen, Calendar, Globe, Star, Check } from "lucide-react";
import type { ExternalBook } from "@/hooks/useExternalBooks";
import { useAddExternalBook } from "@/hooks/useExternalBooks";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAddToShelf, useUpdateUserBook } from "@/hooks/useUserBooks";
import { QuickRating } from "./QuickRating";
import { useTranslation } from "react-i18next";

interface ExternalBookCardProps {
  book: ExternalBook;
}

const ExternalRatingStars = ({ rating, count, source }: { 
  rating: number; 
  count: number; 
  source: string;
}) => {
  const { t } = useTranslation();
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  
  const sourceName = source === "google_books" ? "Google Books" : 
                     source === "open_library" ? "OpenLibrary" : "externa";
  
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${
              i < fullStars 
                ? "fill-accent text-accent" 
                : i === fullStars && hasHalfStar 
                  ? "fill-accent/50 text-accent" 
                  : "text-muted-foreground/30"
            }`} 
          />
        ))}
      </div>
      <span>
        ({count > 0 ? count.toLocaleString() : "0"} {t("bookCard.reviewsIn", { source: sourceName })})
      </span>
    </div>
  );
};

export const ExternalBookCard = ({ book }: ExternalBookCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const addBook = useAddExternalBook();
  const addToShelf = useAddToShelf();
  const updateUserBook = useUpdateUserBook();
  
  const [addedBookId, setAddedBookId] = useState<string | null>(null);
  const [userBookId, setUserBookId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCardClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('[role="button"]') ||
      target.closest('[data-interactive="true"]')
    ) {
      return;
    }

    setIsNavigating(true);
    try {
      const result = await addBook.mutateAsync(book);
      setAddedBookId(result.id);
      navigate(`/libro/${result.id}`);
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("bookCard.couldNotLoad"),
      });
      setIsNavigating(false);
    }
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await addBook.mutateAsync(book);
      setAddedBookId(result.id);
      
      if (result.existing) {
        toast({
          title: t("bookCard.bookExists"),
          description: t("bookCard.bookExistsDesc"),
        });
      } else {
        toast({
          title: t("bookCard.bookAdded"),
          description: t("bookCard.bookAddedDesc"),
        });
      }
      
      navigate(`/libro/${result.id}`);
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("bookCard.couldNotAdd"),
      });
    }
  };

  const handleAddWithRating = async (rating: number) => {
    if (!user) {
      toast({
        title: t("bookCard.loginToRate"),
        description: t("bookCard.loginToRateDesc"),
      });
      return;
    }

    try {
      const bookResult = await addBook.mutateAsync(book);
      setAddedBookId(bookResult.id);
      
      if (userBookId) {
        await updateUserBook.mutateAsync({ id: userBookId, rating });
      } else {
        const shelfResult = await addToShelf.mutateAsync({ 
          bookId: bookResult.id, 
          status: "read", 
          rating 
        });
        setUserBookId(shelfResult.id);
      }
      
      setUserRating(rating);
      
      toast({
        title: t("bookCard.bookRated"),
        description: t("bookCard.bookRatedDesc", { title: book.title, rating }),
      });
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("bookCard.couldNotRate"),
      });
    }
  };

  const sourceLabel = book.source === "google_books" ? "Google Books" : 
                      book.source === "merged" ? t("bookCard.multipleSources") : "OpenLibrary";
  
  const hasExternalRating = book.external_rating && book.external_rating > 0;
  const isLoading = addBook.isPending || isNavigating;

  return (
    <Card 
      className="p-4 shadow-card border-dashed border-primary/30 cursor-pointer hover:shadow-warm transition-shadow relative"
      onClick={handleCardClick}
    >
      {isNavigating && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg z-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      <div className="flex gap-4">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-20 h-28 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-28 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-0.5 line-clamp-2 hover:text-primary transition-colors">
                {book.title}
              </h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {book.authors.join(", ")}
          </p>
          
          {hasExternalRating && (
            <div className="mb-2">
              <ExternalRatingStars 
                rating={book.external_rating!} 
                count={book.external_ratings_count || 0}
                source={book.source}
              />
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 mb-2">
            {book.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
            <Badge variant="secondary" className="text-xs">
              {sourceLabel}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
            {book.published_year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {book.published_year}
              </span>
            )}
            {book.page_count && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {book.page_count} {t("bookCard.pages")}
              </span>
            )}
            {book.language && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {book.language.toUpperCase()}
              </span>
            )}
          </div>

          {user && (
            <div className="mb-3 pb-3 border-b border-border" data-interactive="true">
              <QuickRating
                bookId={addedBookId || "pending"}
                currentRating={userRating}
                onRate={handleAddWithRating}
                size="sm"
              />
              {userRating && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-secondary" />
                  {t("bookCard.addedToLibrary")}
                </p>
              )}
            </div>
          )}

          {!userRating && (
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t("bookCard.addToLibrary")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
