import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, ThumbsDown, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/hooks/useReviews";
import { useVoteReview } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewCardProps {
  review: Review;
  showBookInfo?: boolean;
}

export const ReviewCard = ({ review, showBookInfo = false }: ReviewCardProps) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const voteReview = useVoteReview();

  const isLongContent = review.content.length > 300;
  const displayContent = isLongContent && !expanded 
    ? review.content.slice(0, 300) + "..." 
    : review.content;

  const handleVote = (vote: 1 | -1) => {
    if (!user) return;
    
    const newVote = review.user_vote === vote ? null : vote;
    voteReview.mutate({ reviewId: review.id, vote: newVote });
  };

  const rating = review.user_book?.rating;

  return (
    <Card className="p-4 shadow-card">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={review.profile?.avatar_url ?? undefined} />
          <AvatarFallback className="gradient-autumn text-white">
            {review.profile?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">
              @{review.profile?.username}
            </h4>
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-sm font-medium">{rating}/10</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Book info if needed */}
      {showBookInfo && review.book && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
          {review.book.cover_url ? (
            <img
              src={review.book.cover_url}
              alt={review.book.title}
              className="w-8 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-8 h-12 rounded gradient-autumn" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{review.book.title}</p>
            <p className="text-xs text-muted-foreground">
              {review.book.authors.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Spoiler warning */}
      {review.contains_spoiler && !showSpoiler ? (
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-accent" />
          <p className="text-sm text-muted-foreground mb-2">
            Esta reseña contiene spoilers
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSpoiler(true)}
          >
            Mostrar reseña
          </Button>
        </div>
      ) : (
        <>
          {/* Content */}
          <p className="text-foreground whitespace-pre-wrap">{displayContent}</p>
          
          {isLongContent && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-primary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Leer más
                </>
              )}
            </Button>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1",
            review.user_vote === 1 && "text-secondary"
          )}
          onClick={() => handleVote(1)}
          disabled={!user || voteReview.isPending}
        >
          <ThumbsUp className={cn("w-4 h-4", review.user_vote === 1 && "fill-current")} />
          Útil
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1",
            review.user_vote === -1 && "text-destructive"
          )}
          onClick={() => handleVote(-1)}
          disabled={!user || voteReview.isPending}
        >
          <ThumbsDown className={cn("w-4 h-4", review.user_vote === -1 && "fill-current")} />
        </Button>
        
        {(review.votes_count ?? 0) !== 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {review.votes_count! > 0 ? "+" : ""}{review.votes_count} votos
          </span>
        )}
      </div>
    </Card>
  );
};
