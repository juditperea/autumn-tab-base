import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FavoriteBook {
  id: string;
  user_id: string;
  book_id: string;
  position: number;
  created_at: string;
  book?: {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
  };
}

export const useFavoriteBooks = (userId?: string) => {
  return useQuery({
    queryKey: ["favorite-books", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get favorite books
      const { data: favorites, error: favError } = await supabase
        .from("favorite_books")
        .select("*")
        .eq("user_id", userId)
        .order("position");

      if (favError) throw favError;
      if (!favorites || favorites.length === 0) return [];

      // Get the book details
      const bookIds = favorites.map(f => f.book_id);
      const { data: books, error: booksError } = await supabase
        .from("books")
        .select("id, title, authors, cover_url")
        .in("id", bookIds);

      if (booksError) throw booksError;

      // Combine the data
      const booksMap = new Map(books?.map(b => [b.id, b]) ?? []);
      return favorites.map(fav => ({
        ...fav,
        book: booksMap.get(fav.book_id) ?? undefined,
      })) as FavoriteBook[];
    },
    enabled: !!userId,
  });
};

export const useManageFavoriteBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addFavorite = useMutation({
    mutationFn: async ({ bookId, position }: { bookId: string; position: number }) => {
      if (!user) throw new Error("No user");

      // First, remove any existing book at this position
      await supabase
        .from("favorite_books")
        .delete()
        .eq("user_id", user.id)
        .eq("position", position);

      // Also remove this book if it's already in favorites at another position
      await supabase
        .from("favorite_books")
        .delete()
        .eq("user_id", user.id)
        .eq("book_id", bookId);

      // Insert new favorite
      const { error } = await supabase.from("favorite_books").insert({
        user_id: user.id,
        book_id: bookId,
        position,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-books"] });
      toast({
        title: "Libro favorito añadido",
        description: "Tu libro favorito se ha guardado",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo añadir el libro favorito",
      });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (position: number) => {
      if (!user) throw new Error("No user");

      const { error } = await supabase
        .from("favorite_books")
        .delete()
        .eq("user_id", user.id)
        .eq("position", position);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-books"] });
      toast({
        title: "Libro eliminado",
        description: "El libro se ha quitado de tus favoritos",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el libro",
      });
    },
  });

  return {
    addFavorite,
    removeFavorite,
  };
};
