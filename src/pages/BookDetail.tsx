import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { ArrowLeft, Star, Calendar, BookOpen, Globe, Loader2 } from "lucide-react";
import { useBook } from "@/hooks/useBooks";
import { useUserBookForBook, useAddToShelf, useUpdateUserBook, useRemoveFromShelf } from "@/hooks/useUserBooks";
import { StatusSelector } from "@/components/books/StatusSelector";
import { RatingControl } from "@/components/books/RatingControl";
import { ReviewList } from "@/components/reviews/ReviewList";
import { useToast } from "@/hooks/use-toast";
import type { ReadingStatus } from "@/hooks/useUserBooks";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: book, isLoading: bookLoading, error: bookError } = useBook(id);
  const { data: userBook, isLoading: userBookLoading } = useUserBookForBook(id);
  
  const addToShelf = useAddToShelf();
  const updateUserBook = useUpdateUserBook();
  const removeFromShelf = useRemoveFromShelf();

  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const handleStatusChange = async (status: ReadingStatus) => {
    try {
      if (userBook) {
        await updateUserBook.mutateAsync({ id: userBook.id, status });
      } else {
        await addToShelf.mutateAsync({ bookId: id!, status });
      }
      toast({
        title: "Libro guardado",
        description: `Se ha añadido a tu biblioteca`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el libro",
      });
    }
  };

  const handleRatingChange = async (rating: number | null) => {
    if (!userBook) return;
    
    try {
      await updateUserBook.mutateAsync({ id: userBook.id, rating });
      setShowRatingDialog(false);
      toast({
        title: rating ? "Puntuación guardada" : "Puntuación eliminada",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la puntuación",
      });
    }
  };

  const handleRemove = async () => {
    if (!userBook) return;
    
    try {
      await removeFromShelf.mutateAsync(userBook.id);
      toast({
        title: "Libro eliminado",
        description: "Se ha quitado de tu biblioteca",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el libro",
      });
    }
  };

  if (bookLoading || userBookLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">Libro no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El libro que buscas no existe o ha sido eliminado
          </p>
          <Button onClick={() => navigate(-1)}>Volver</Button>
        </Card>
      </div>
    );
  }

  const isPending = addToShelf.isPending || updateUserBook.isPending || removeFromShelf.isPending;

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground truncate flex-1 mx-4">
            {book.title}
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Book Info Card */}
        <Card className="p-6 shadow-card">
          <div className="flex gap-4">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-28 h-40 rounded-lg object-cover flex-shrink-0 shadow-warm"
              />
            ) : (
              <div className="w-28 h-40 rounded-lg gradient-autumn flex-shrink-0 shadow-warm" />
            )}
            
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1 line-clamp-2">
                {book.title}
              </h2>
              <p className="text-muted-foreground mb-3">
                {book.authors.join(", ")}
              </p>

              {/* Rating */}
              {book.average_rating > 0 ? (
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="text-lg font-bold text-foreground">
                    {book.average_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({book.ratings_count} {book.ratings_count === 1 ? "puntuación" : "puntuaciones"})
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">Sin puntuaciones aún</p>
              )}

              {/* Genres */}
              <div className="flex flex-wrap gap-1">
                {book.genres.slice(0, 3).map((genre) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
            {book.published_year && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {book.published_year}
              </div>
            )}
            {book.page_count && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {book.page_count} páginas
              </div>
            )}
            {book.language && (
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                {book.language.toUpperCase()}
              </div>
            )}
          </div>
        </Card>

        {/* User Actions */}
        <Card className="p-4 shadow-card">
          <StatusSelector
            value={userBook?.status ?? null}
            onChange={handleStatusChange}
            onRemove={userBook ? handleRemove : undefined}
            loading={isPending}
            variant="buttons"
          />

          {/* Rating for user */}
          {userBook && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Tu puntuación</p>
                  {userBook.rating ? (
                    <p className="text-2xl font-bold text-primary">{userBook.rating}/10</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin puntuar</p>
                  )}
                </div>
                <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      {userBook.rating ? "Cambiar" : "Puntuar"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Puntúa "{book.title}"</DialogTitle>
                    </DialogHeader>
                    <RatingControl
                      value={userBook.rating}
                      onChange={handleRatingChange}
                      size="lg"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}
        </Card>

        {/* Description */}
        {book.description && (
          <Card className="p-4 shadow-card">
            <h3 className="font-semibold text-foreground mb-2">Sinopsis</h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {book.description}
            </p>
          </Card>
        )}

        {/* Reviews */}
        <ReviewList bookId={book.id} />
      </main>
    </div>
  );
};

export default BookDetail;
