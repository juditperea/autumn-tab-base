import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface IdentifiedBook {
  title: string;
  authors: string[];
  isbn: string | null;
  confidence: "high" | "medium" | "low";
  language?: string;
  error?: string;
}

export function useCoverIdentification() {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifiedBook, setIdentifiedBook] = useState<IdentifiedBook | null>(null);

  const identifyFromImage = async (file: File): Promise<IdentifiedBook | null> => {
    setIsIdentifying(true);
    setError(null);
    setIdentifiedBook(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      const { data, error: fnError } = await supabase.functions.invoke("identify-book-cover", {
        body: { imageBase64: base64 },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        setError(data.error);
        return null;
      }

      setIdentifiedBook(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al identificar el libro";
      setError(message);
      return null;
    } finally {
      setIsIdentifying(false);
    }
  };

  const clear = () => {
    setIdentifiedBook(null);
    setError(null);
  };

  return {
    identifyFromImage,
    isIdentifying,
    error,
    identifiedBook,
    clear,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
