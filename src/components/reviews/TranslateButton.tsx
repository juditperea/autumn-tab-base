import { useState } from "react";
import { Languages, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface TranslateButtonProps {
  content: string;
  reviewLanguage?: string;
  onTranslation: (translated: string | null) => void;
  isTranslated: boolean;
}

export const TranslateButton = ({ content, reviewLanguage, onTranslation, isTranslated }: TranslateButtonProps) => {
  const { i18n, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const userLang = i18n.language.startsWith("es") ? "es" : "en";
  const isSameLanguage = reviewLanguage === userLang;

  if (isSameLanguage) return null;

  const handleTranslate = async () => {
    if (isTranslated) {
      onTranslation(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-review", {
        body: { text: content, targetLanguage: userLang },
      });

      if (error) throw error;
      if (data?.translatedText) {
        onTranslation(data.translatedText);
      }
    } catch (err) {
      console.error("Translation error:", err);
      toast.error(t("review.translateError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 text-xs text-muted-foreground"
      onClick={handleTranslate}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isTranslated ? (
        <X className="w-3 h-3" />
      ) : (
        <Languages className="w-3 h-3" />
      )}
      {isTranslated ? t("review.showOriginal") : t("review.translate")}
    </Button>
  );
};
