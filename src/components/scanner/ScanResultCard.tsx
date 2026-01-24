import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Calendar, Globe, Check, X, BookPlus, Eye } from "lucide-react";
import type { ExternalBook } from "@/hooks/useExternalBooks";
import { useAddExternalBook } from "@/hooks/useExternalBooks";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAddToShelf } from "@/hooks/useUserBooks";
import { RatingControl } from "@/components/books/RatingControl";

interface ScanResultCardProps {
  book: ExternalBook;
  onDismiss: () => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({ book, onDismiss }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const addBook = useAddExternalBook();
  const addToShelf = useAddToShelf();
  
  const [rating, setRating] = useState<number>(7);
  const [isAdding, setIsAdding] = useState(false);
  const [addedBookId, setAddedBookId] = useState<string | null>(null);

  const handleAddToLibrary = async (status: "to_read" | "reading" | "read") => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para añadir libros",
      });
      return;
    }

    setIsAdding(true);
    try {
      // First add book to database
      const bookResult = await addBook.mutateAsync(book);
      setAddedBookId(bookResult.id);
      
      // Then add to user's shelf
      await addToShelf.mutateAsync({
        bookId: bookResult.id,
        status,
        rating: status === "read" ? rating : undefined,
      });
      
      toast({
        title: "¡Libro añadido!",
        description: status === "read" 
          ? `"${book.title}" añadido como leído con ${rating}/10`
          : `"${book.title}" añadido a tu biblioteca`,
      });
      
      // Navigate to book detail
      navigate(`/libro/${bookResult.id}`);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el libro",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleViewDetails = async () => {
    setIsAdding(true);
    try {
      const bookResult = await addBook.mutateAsync(book);
      navigate(`/libro/${bookResult.id}`);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el libro",
      });
      setIsAdding(false);
    }
  };

  return (
    <Card className="p-4 shadow-warm border-primary/20">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-foreground">¡Libro encontrado!</h3>
        <Button size="icon" variant="ghost" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-24 h-36 rounded-lg object-cover flex-shrink-0 shadow-md"
          />
        ) : (
          <div className="w-24 h-36 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground line-clamp-2 mb-1">{book.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">
            {book.authors.join(", ")}
          </p>

          <div className="flex flex-wrap gap-1 mb-2">
            {book.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
        </div>
      </div>

      {/* Rating for "read" status */}
      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium text-foreground mb-2">¿Ya lo leíste? Puntúalo:</p>
        <RatingControl value={rating} onChange={setRating} size="md" />
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddToLibrary("to_read")}
            disabled={isAdding}
            className="flex-1"
          >
            <BookPlus className="w-4 h-4 mr-2" />
            Por leer
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddToLibrary("reading")}
            disabled={isAdding}
            className="flex-1"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Leyendo
          </Button>
        </div>
        
        <Button
          onClick={() => handleAddToLibrary("read")}
          disabled={isAdding}
          className="w-full shadow-warm"
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Leído ({rating}/10)
        </Button>

        <Button
          variant="ghost"
          onClick={handleViewDetails}
          disabled={isAdding}
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver detalles del libro
        </Button>
      </div>
    </Card>
  );
};
