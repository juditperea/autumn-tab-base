import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useSetReadingGoal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: number) => {
      if (!user) throw new Error("No user");

      const currentYear = new Date().getFullYear();

      // Check if goal already set for this year
      const { data: profile } = await supabase
        .from("profiles")
        .select("reading_goal, reading_goal_year")
        .eq("id", user.id)
        .single();

      if (profile?.reading_goal_year === currentYear) {
        throw new Error("Ya has establecido tu objetivo para este año. No se puede modificar.");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          reading_goal: goal,
          reading_goal_year: currentYear,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "¡Objetivo establecido!",
        description: "Tu desafío de lectura anual ha sido guardado. ¡Buena suerte! 📚",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo establecer el objetivo",
      });
    },
  });
};
