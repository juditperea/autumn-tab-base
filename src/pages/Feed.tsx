import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { useRecentReviews } from "@/hooks/useReviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";

const Feed = () => {
  const { data: reviews, isLoading, error } = useRecentReviews(20);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold gradient-autumn bg-clip-text text-transparent">
            Bookly
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Feed Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-6 text-center shadow-card">
            <p className="text-destructive">Error al cargar el feed</p>
          </Card>
        ) : reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} showBookInfo />
          ))
        ) : (
          <Card className="p-8 text-center shadow-card">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold text-foreground mb-2">
              Sin actividad reciente
            </h3>
            <p className="text-sm text-muted-foreground">
              Las reseñas de la comunidad aparecerán aquí
            </p>
          </Card>
        )}

        {/* Discover prompt */}
        <Card className="p-6 text-center shadow-card bg-muted/50">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold text-foreground mb-2">
            Descubre más libros
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explora nuestra colección y empieza a leer
          </p>
          <a 
            href="/buscar" 
            className="inline-block px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 tab-transition"
          >
            Explorar
          </a>
        </Card>
      </main>
    </div>
  );
};

export default Feed;
