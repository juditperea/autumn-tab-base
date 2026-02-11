import React from "react";
import { Link } from "react-router-dom";
import { Heart, Plus, RefreshCw } from "lucide-react";
import { useFavoriteBooks } from "@/hooks/useFavoriteBooks";
import { useTranslation } from "react-i18next";

interface FavoriteBooksProps {
  userId: string;
  isOwner?: boolean;
  isEditMode?: boolean;
  onAddClick?: (position: number) => void;
}

export const FavoriteBooks: React.FC<FavoriteBooksProps> = ({ 
  userId, 
  isOwner = false,
  isEditMode = false,
  onAddClick 
}) => {
  const { t } = useTranslation();
  const { data: favorites, isLoading } = useFavoriteBooks(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const positions = [1, 2, 3, 4];
  const favoritesByPosition = favorites?.reduce((acc, fav) => {
    acc[fav.position] = fav;
    return acc;
  }, {} as Record<number, typeof favorites[0]>) ?? {};

  // When in edit mode and owner, show editable grid
  if (isEditMode && isOwner && onAddClick) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {positions.map((position) => {
          const favorite = favoritesByPosition[position];
          
          if (favorite?.book) {
            return (
              <button
                key={position}
                onClick={() => onAddClick(position)}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all hover:ring-2 hover:ring-primary"
              >
                {favorite.book.cover_url ? (
                  <img
                    src={favorite.book.cover_url}
                    alt={favorite.book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-xs text-center p-1 text-muted-foreground">
                      {favorite.book.title}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                  <RefreshCw className="w-5 h-5 text-white" />
                </div>
              </button>
            );
          }

          // Empty slot in edit mode
          return (
            <button
              key={position}
              onClick={() => onAddClick(position)}
              className="aspect-[2/3] rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-5 h-5 text-muted-foreground/50" />
            </button>
          );
        })}
      </div>
    );
  }

  // View mode (Profile page)
  return (
    <div className="p-4 bg-card rounded-xl shadow-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary" />
        {t("social.favoriteBooks")}
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {positions.map((position) => {
          const favorite = favoritesByPosition[position];
          
          if (favorite?.book) {
            return (
              <Link
                key={position}
                to={`/libro/${favorite.book.id}`}
                className="group relative aspect-[2/3] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {favorite.book.cover_url ? (
                  <img
                    src={favorite.book.cover_url}
                    alt={favorite.book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-xs text-center p-1 text-muted-foreground">
                      {favorite.book.title}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                  <span className="text-white text-xs text-center line-clamp-3">
                    {favorite.book.title}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <div
              key={position}
              className="aspect-[2/3] rounded-lg bg-muted/30"
            />
          );
        })}
      </div>
    </div>
  );
};
