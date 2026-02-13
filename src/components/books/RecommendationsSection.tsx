import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Sparkles, BookOpen } from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useTranslation } from "react-i18next";

interface RecommendationsSectionProps {
  limit?: number;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ limit = 8 }) => {
  const { t } = useTranslation();
  const { data: books, isLoading } = useRecommendations(limit);

  if (isLoading) {
    return (
      <section>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {t("recommendations.title")}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-32 h-56 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!books?.length) return null;

  return (
    <section>
      <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        {t("recommendations.title")}
      </h2>
      <p className="text-sm text-muted-foreground mb-3">{t("recommendations.subtitle")}</p>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/libro/${book.id}`}
            className="flex-shrink-0 w-32 group"
          >
            <div className="relative mb-2">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-32 h-48 rounded-lg object-cover shadow-md group-hover:shadow-lg transition-shadow"
                />
              ) : (
                <div className="w-32 h-48 rounded-lg bg-muted flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {book.average_rating && book.average_rating > 0 && (
                <div className="absolute bottom-1 right-1 bg-background/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-accent text-accent" />
                  <span className="text-xs font-medium">{book.average_rating}</span>
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
              {book.title}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {book.authors.join(", ")}
            </p>
            {book.reason && (
              <Badge variant="secondary" className="text-[10px] mt-1 px-1.5 py-0">
                {t("recommendations.because", { genre: book.reason })}
              </Badge>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};