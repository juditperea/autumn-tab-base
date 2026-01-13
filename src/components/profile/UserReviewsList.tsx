import { Card } from "@/components/ui/card";
import { MessageSquare, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserReviews, type Review } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";

interface UserReviewsListProps {
  limit?: number;
  showAll?: boolean;
}

export const UserReviewsList = ({ limit = 3, showAll = false }: UserReviewsListProps) => {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useUserReviews(user?.id);

  const displayReviews = showAll ? reviews : reviews?.slice(0, limit);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!displayReviews || displayReviews.length === 0) {
    return (
      <Card className="p-6 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No has escrito ninguna reseña todavía
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Lee un libro y comparte tu opinión
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayReviews.map((review: Review) => (
        <Link
          key={review.id}
          to={`/libro/${review.book_id}`}
          className="block"
        >
          <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              {review.book?.cover_url ? (
                <img
                  src={review.book.cover_url}
                  alt={review.book.title}
                  className="w-12 h-16 rounded object-cover shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-16 rounded gradient-autumn flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {review.book?.title}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {review.book?.authors.join(", ")}
                </p>
                <p className="text-sm text-foreground line-clamp-2">
                  {review.content}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(review.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {review.contains_spoiler && (
                    <span className="text-accent">• Contiene spoilers</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
      
      {!showAll && reviews && reviews.length > limit && (
        <p className="text-center text-sm text-muted-foreground">
          Y {reviews.length - limit} reseñas más...
        </p>
      )}
    </div>
  );
};
