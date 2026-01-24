import { useState } from "react";
import { useSearchBooks } from "@/hooks/useBooks";
import { useDebounce } from "@/hooks/useDebounce";
import { useUpdateClub } from "@/hooks/useClubs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen, X, Check } from "lucide-react";

interface SelectBookDialogProps {
  clubId: string;
  currentBookId: string | null;
  trigger: React.ReactNode;
}

export const SelectBookDialog = ({
  clubId,
  currentBookId,
  trigger,
}: SelectBookDialogProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: books, isLoading } = useSearchBooks(debouncedQuery);
  const { mutate: updateClub, isPending } = useUpdateClub();
  const { toast } = useToast();

  const handleSelect = (bookId: string | null) => {
    updateClub(
      { clubId, updates: { current_book_id: bookId } },
      {
        onSuccess: () => {
          toast({
            title: bookId ? "Libro del mes actualizado" : "Libro eliminado",
            description: bookId
              ? "El club ahora tiene un nuevo libro activo"
              : "El club ya no tiene libro activo",
          });
          setOpen(false);
          setQuery("");
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Seleccionar libro del mes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar libro por título..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {currentBookId && (
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => handleSelect(null)}
              disabled={isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Quitar libro activo
            </Button>
          )}

          <ScrollArea className="h-[300px]">
            {isLoading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="w-12 h-16 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && query && books?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No se encontraron libros</p>
                <p className="text-sm">Prueba con otro término</p>
              </div>
            )}

            {!query && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Busca un libro para seleccionarlo</p>
              </div>
            )}

            <div className="space-y-1">
              {books?.map((book) => {
                const isSelected = book.id === currentBookId;

                return (
                  <button
                    key={book.id}
                    onClick={() => handleSelect(book.id)}
                    disabled={isPending}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {book.authors.join(", ")}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
