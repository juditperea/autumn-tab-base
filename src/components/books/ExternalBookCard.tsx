import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, BookOpen, Calendar, Globe, Star, Check, Languages } from "lucide-react";
import type { ExternalBook } from "@/hooks/useExternalBooks";
import { useAddExternalBook } from "@/hooks/useExternalBooks";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAddToShelf, useUpdateUserBook } from "@/hooks/useUserBooks";
import { QuickRating } from "./QuickRating";

interface ExternalBookCardProps {
  book: ExternalBook;
}

// Render stars for external rating (1-5 scale)
const ExternalRatingStars = ({ rating, count, source }: { 
  rating: number; 
  count: number; 
  source: string;
}) => {
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
        ({count > 0 ? count.toLocaleString() : "0"} en {sourceName})
      </span>
    </div>
  );
};

export const ExternalBookCard = ({ book }: ExternalBookCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const addBook = useAddExternalBook();
  const addToShelf = useAddToShelf();
  const updateUserBook = useUpdateUserBook();
  
  // Track if book was added and its ID
  const [addedBookId, setAddedBookId] = useState<string | null>(null);
  const [userBookId, setUserBookId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Navigate to book detail - adds book to DB first if needed
  const handleCardClick = async (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
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
        title: "Error",
        description: "No se pudo cargar el libro",
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
          title: "Libro ya existe",
          description: "Este libro ya estaba en la base de datos",
        });
      } else {
        toast({
          title: "Libro añadido",
          description: "El libro se ha añadido correctamente",
        });
      }
      
      // Navigate to the book detail page
      navigate(`/libro/${result.id}`);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el libro",
      });
    }
  };

  const handleAddWithRating = async (rating: number) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para puntuar libros",
      });
      return;
    }

    try {
      // First add the book to the database
      const bookResult = await addBook.mutateAsync(book);
      setAddedBookId(bookResult.id);
      
      // Then add to user's shelf with rating
      if (userBookId) {
        // Already in shelf, just update rating
        await updateUserBook.mutateAsync({ id: userBookId, rating });
      } else {
        // Add to shelf with rating
        const shelfResult = await addToShelf.mutateAsync({ 
          bookId: bookResult.id, 
          status: "read", 
          rating 
        });
        setUserBookId(shelfResult.id);
      }
      
      setUserRating(rating);
      
      toast({
        title: "¡Libro puntuado!",
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

  const sourceLabel = book.source === "google_books" ? "Google Books" : 
                      book.source === "merged" ? "Múltiples fuentes" : "OpenLibrary";
  
  // Show external rating if available
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
              {/* Always show original title as subtitle when translated */}
              {book.translated && book.original_title && book.original_title !== book.title && (
                <p className="text-xs text-muted-foreground/70 italic mb-1 flex items-center gap-1">
                  <Languages className="w-3 h-3 text-primary/60" />
                  <span>Original: {book.original_title}</span>
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {book.authors.join(", ")}
          </p>
          
          {/* External rating as orientation */}
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
                {book.page_count} pág.
              </span>
            )}
            {book.language && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {book.language.toUpperCase()}
              </span>
            )}
          </div>

          {/* Quick Rating for logged in users */}
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
                  Añadido a tu biblioteca
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
              Añadir a la biblioteca
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
