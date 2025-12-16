import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Loader2, Filter } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { ReviewEditor } from "./ReviewEditor";
import { useBookReviews, type Review } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewListProps {
  bookId: string;
}

type SortOption = "recent" | "oldest" | "helpful";
type FilterOption = "all" | "es" | "en";

export const ReviewList = ({ bookId }: ReviewListProps) => {
  const { user } = useAuth();
  const { data: reviews, isLoading, error } = useBookReviews(bookId);
  const [showEditor, setShowEditor] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterLang, setFilterLang] = useState<FilterOption>("all");

  const userHasReview = reviews?.some((r) => r.user_id === user?.id);

  const filteredAndSortedReviews = reviews
    ?.filter((review) => {
      if (filterLang === "all") return true;
      return review.language === filterLang;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "helpful":
          return (b.votes_count ?? 0) - (a.votes_count ?? 0);
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">Error al cargar las reseñas</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Reseñas ({reviews?.length ?? 0})
        </h3>

        <div className="flex items-center gap-2">
          <Select value={filterLang} onValueChange={(v) => setFilterLang(v as FilterOption)}>
            <SelectTrigger className="w-[100px] h-8">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguas</SelectItem>
              <SelectItem value="helpful">Más útiles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Write review button or editor */}
      {user && !userHasReview && !showEditor && (
        <Button 
          onClick={() => setShowEditor(true)}
          variant="outline"
          className="w-full"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Escribir una reseña
        </Button>
      )}

      {showEditor && (
        <ReviewEditor
          bookId={bookId}
          onSuccess={() => setShowEditor(false)}
          onCancel={() => setShowEditor(false)}
        />
      )}

      {/* Reviews list */}
      {filteredAndSortedReviews && filteredAndSortedReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center shadow-card">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h4 className="font-semibold text-foreground mb-2">
            Sin reseñas todavía
          </h4>
          <p className="text-sm text-muted-foreground">
            {user 
              ? "¡Sé el primero en escribir una reseña!"
              : "Inicia sesión para escribir una reseña"
            }
          </p>
        </Card>
      )}
    </div>
  );
};
