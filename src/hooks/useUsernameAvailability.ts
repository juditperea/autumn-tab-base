import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUsernameAvailability = (username: string, debounceMs = 500) => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    // Validar formato básico
    const validFormat = /^[a-zA-Z0-9_]+$/.test(username);
    if (!validFormat) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username)
          .maybeSingle();

        setIsAvailable(!data);
      } catch (error) {
        console.error("Error checking username:", error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsChecking(false);
    };
  }, [username, debounceMs]);

  return { isAvailable, isChecking };
};
