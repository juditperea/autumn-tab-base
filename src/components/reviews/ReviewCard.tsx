import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, ThumbsDown, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Review } from "@/hooks/useReviews";
import { useVoteReview } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewComments } from "./ReviewComments";
import { TranslateButton } from "./TranslateButton";
import { useTranslation } from "react-i18next";

interface ReviewCardProps {
  review: Review;
  showBookInfo?: boolean;
}

export const ReviewCard = ({ review, showBookInfo = false }: ReviewCardProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const voteReview = useVoteReview();

  const activeContent = translatedContent ?? review.content;
  const isLongContent = activeContent.length > 300;
  const displayContent = isLongContent && !expanded 
    ? activeContent.slice(0, 300) + "..." 
    : activeContent;

  const handleVote = (vote: 1 | -1) => {
    if (!user) return;
    const newVote = review.user_vote === vote ? null : vote;
    voteReview.mutate({ reviewId: review.id, vote: newVote });
  };

  const rating = review.user_book?.rating;
  const dateLocale = i18n.language.startsWith("es") ? "es-ES" : "en-US";

  return (
    <Card className="p-4 shadow-card">
      <div className="flex items-start gap-3 mb-3">
        <Link to={`/perfil/${review.profile?.username}`}>
          <Avatar className="w-10 h-10 hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={review.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="gradient-autumn text-white">
              {review.profile?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Link to={`/perfil/${review.profile?.username}`} className="hover:underline">
              <h4 className="font-semibold text-foreground">@{review.profile?.username}</h4>
            </Link>
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-sm font-medium">{rating}/10</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString(dateLocale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {showBookInfo && review.book && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
          {review.book.cover_url ? (
            <img src={review.book.cover_url} alt={review.book.title} className="w-8 h-12 rounded object-cover" />
          ) : (
            <div className="w-8 h-12 rounded gradient-autumn" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{review.book.title}</p>
            <p className="text-xs text-muted-foreground">{review.book.authors.join(", ")}</p>
          </div>
        </div>
      )}

      {review.contains_spoiler && !showSpoiler ? (
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-accent" />
          <p className="text-sm text-muted-foreground mb-2">{t("review.containsSpoilerWarning")}</p>
          <Button variant="outline" size="sm" onClick={() => setShowSpoiler(true)}>
            {t("review.showSpoiler")}
          </Button>
        </div>
      ) : (
        <>
          <p className="text-foreground whitespace-pre-wrap">{displayContent}</p>
          {isLongContent && (
            <Button variant="ghost" size="sm" className="mt-2 text-primary" onClick={() => setExpanded(!expanded)}>
              {expanded ? (
                <><ChevronUp className="w-4 h-4 mr-1" />{t("review.showLess")}</>
              ) : (
                <><ChevronDown className="w-4 h-4 mr-1" />{t("review.readMore")}</>
              )}
            </Button>
          )}
          <TranslateButton
            content={review.content}
            reviewLanguage={review.language}
            onTranslation={setTranslatedContent}
            isTranslated={!!translatedContent}
          />
        </>
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <Button variant="ghost" size="sm" className={cn("gap-1", review.user_vote === 1 && "text-secondary")} onClick={() => handleVote(1)} disabled={!user || voteReview.isPending}>
          <ThumbsUp className={cn("w-4 h-4", review.user_vote === 1 && "fill-current")} />
          {t("review.useful")}
        </Button>
        <Button variant="ghost" size="sm" className={cn("gap-1", review.user_vote === -1 && "text-destructive")} onClick={() => handleVote(-1)} disabled={!user || voteReview.isPending}>
          <ThumbsDown className={cn("w-4 h-4", review.user_vote === -1 && "fill-current")} />
        </Button>
        {(review.votes_count ?? 0) !== 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {review.votes_count! > 0 ? "+" : ""}{review.votes_count} {t("review.votes")}
          </span>
        )}
      </div>

      <ReviewComments reviewId={review.id} />
    </Card>
  );
};
