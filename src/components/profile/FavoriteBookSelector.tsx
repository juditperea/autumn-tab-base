import React, { useState } from "react";
import { Search, X, Book } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserBooks } from "@/hooks/useUserBooks";
import { useManageFavoriteBooks } from "@/hooks/useFavoriteBooks";

interface FavoriteBookSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: number;
}

export const FavoriteBookSelector: React.FC<FavoriteBookSelectorProps> = ({
  open,
  onOpenChange,
  position,
}) => {
  const [search, setSearch] = useState("");
  const { data: userBooks, isLoading } = useUserBooks();
  const { addFavorite } = useManageFavoriteBooks();

  const readBooks = userBooks?.filter((ub) => ub.status === "read") ?? [];
  
  const filteredBooks = readBooks.filter((ub) =>
    ub.book?.title.toLowerCase().includes(search.toLowerCase()) ||
    ub.book?.authors?.some((a) => a.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = async (bookId: string) => {
    await addFavorite.mutateAsync({ bookId, position });
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            Seleccionar libro favorito #{position}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en tus libros leídos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearch("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px] pr-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Book className="w-10 h-10 mx-auto mb-2 opacity-50" />
              {readBooks.length === 0 ? (
                <p>No tienes libros leídos aún</p>
              ) : (
                <p>No se encontraron resultados</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBooks.map((ub) => (
                <button
                  key={ub.id}
                  onClick={() => handleSelect(ub.book_id)}
                  disabled={addFavorite.isPending}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  {ub.book?.cover_url ? (
                    <img
                      src={ub.book.cover_url}
                      alt={ub.book.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                      <Book className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {ub.book?.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {ub.book?.authors?.join(", ")}
                    </p>
                  </div>
                  {ub.rating && (
                    <span className="text-sm font-medium text-primary">
                      {ub.rating}/10
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
