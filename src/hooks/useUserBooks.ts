import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ReadingStatus = "to_read" | "reading" | "read" | "dnf";

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  rating: number | null;
  progress_percent: number;
  progress_pages: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined book data
  book?: {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
    page_count: number | null;
  };
}

export const useUserBooks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userBooks", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_books")
        .select(`
          *,
          book:books(id, title, authors, cover_url, page_count)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as UserBook[];
    },
    enabled: !!user?.id,
  });
};

export const useUserBooksByStatus = (status: ReadingStatus) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userBooks", user?.id, status],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_books")
        .select(`
          *,
          book:books(id, title, authors, cover_url, page_count)
        `)
        .eq("user_id", user.id)
        .eq("status", status)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as UserBook[];
    },
    enabled: !!user?.id,
  });
};

export const useUserBookForBook = (bookId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userBook", user?.id, bookId],
    queryFn: async () => {
      if (!user?.id || !bookId) return null;

      const { data, error } = await supabase
        .from("user_books")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

      if (error) throw error;
      return data as UserBook | null;
    },
    enabled: !!user?.id && !!bookId,
  });
};

export const useAddToShelf = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      bookId, 
      status,
      rating,
    }: { 
      bookId: string; 
      status: ReadingStatus;
      rating?: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_books")
        .insert({
          user_id: user.id,
          book_id: bookId,
          status,
          rating: rating ?? null,
          started_at: status === "reading" ? new Date().toISOString().split("T")[0] : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: ["userBooks"] });
      queryClient.invalidateQueries({ queryKey: ["userBook", user?.id, bookId] });
      queryClient.invalidateQueries({ queryKey: ["book"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
};

export const useUpdateUserBook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rating, 
      progress_percent, 
      progress_pages 
    }: { 
      id: string;
      status?: ReadingStatus;
      rating?: number | null;
      progress_percent?: number;
      progress_pages?: number;
    }) => {
      const updates: Record<string, unknown> = {};
      
      if (status !== undefined) {
        updates.status = status;
        if (status === "reading" && !updates.started_at) {
          updates.started_at = new Date().toISOString().split("T")[0];
        }
        if (status === "read") {
          updates.finished_at = new Date().toISOString().split("T")[0];
          updates.progress_percent = 100;
        }
      }
      if (rating !== undefined) updates.rating = rating;
      if (progress_percent !== undefined) updates.progress_percent = progress_percent;
      if (progress_pages !== undefined) updates.progress_pages = progress_pages;

      const { data, error } = await supabase
        .from("user_books")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBooks"] });
      queryClient.invalidateQueries({ queryKey: ["userBook"] });
      queryClient.invalidateQueries({ queryKey: ["book"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
};

export const useRemoveFromShelf = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_books")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBooks"] });
      queryClient.invalidateQueries({ queryKey: ["userBook"] });
    },
  });
};

// Stats helpers
export const useUserBooksStats = () => {
  const { data: userBooks } = useUserBooks();

  const stats = {
    total: userBooks?.length ?? 0,
    toRead: userBooks?.filter(ub => ub.status === "to_read").length ?? 0,
    reading: userBooks?.filter(ub => ub.status === "reading").length ?? 0,
    read: userBooks?.filter(ub => ub.status === "read").length ?? 0,
    dnf: userBooks?.filter(ub => ub.status === "dnf").length ?? 0,
  };

  return stats;
};
