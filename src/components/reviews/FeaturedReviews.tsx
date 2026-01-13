import { Card } from "@/components/ui/card";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useFeaturedReviews, type Review } from "@/hooks/useReviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeaturedReviewsProps {
  limit?: number;
}

export const FeaturedReviews = ({ limit = 5 }: FeaturedReviewsProps) => {
  const { data: reviews, isLoading } = useFeaturedReviews(limit);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card className="p-6 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Aún no hay reseñas destacadas
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          ¡Sé el primero en escribir una reseña!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review: Review) => (
        <Link
          key={review.id}
          to={`/libro/${review.book_id}`}
          className="block"
        >
          <Card className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3 mb-3">
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
                <p className="text-xs text-muted-foreground mb-1">
                  {review.book?.authors.join(", ")}
                </p>
                {review.user_book?.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                    <span className="text-xs font-medium">{review.user_book.rating}/10</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-foreground line-clamp-3 mb-3">
              {review.content}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={review.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs gradient-autumn text-white">
                    {review.profile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  @{review.profile?.username}
                </span>
              </div>
              
              {(review.votes_count ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-xs text-secondary">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{review.votes_count} útil{review.votes_count !== 1 ? "es" : ""}</span>
                </div>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};
