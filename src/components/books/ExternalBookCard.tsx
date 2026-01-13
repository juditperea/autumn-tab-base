import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, BookOpen, Calendar, Globe, Star } from "lucide-react";
import type { ExternalBook } from "@/hooks/useExternalBooks";
import { useAddExternalBook } from "@/hooks/useExternalBooks";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
  const addBook = useAddExternalBook();

  const handleAdd = async () => {
    try {
      const result = await addBook.mutateAsync(book);
      
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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el libro",
      });
    }
  };

  const sourceLabel = book.source === "google_books" ? "Google Books" : 
                      book.source === "merged" ? "Múltiples fuentes" : "OpenLibrary";
  
  // Show external rating if available
  const hasExternalRating = book.external_rating && book.external_rating > 0;

  return (
    <Card className="p-4 shadow-card border-dashed border-primary/30">
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
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{book.title}</h3>
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

          <Button
            size="sm"
            onClick={handleAdd}
            disabled={addBook.isPending}
            className="w-full"
          >
            {addBook.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Añadir a la biblioteca
          </Button>
        </div>
      </div>
    </Card>
  );
};
