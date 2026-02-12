import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";

interface QuickRatingProps {
  bookId: string;
  currentRating: number | null;
  onRate: (rating: number) => Promise<void>;
  disabled?: boolean;
  size?: "sm" | "md";
}

const getRatingColor = (rating: number): string => {
  if (rating <= 3) return "text-destructive";
  if (rating <= 5) return "text-orange-500";
  if (rating <= 7) return "text-accent";
  return "text-secondary";
};

const getRatingLabelKey = (rating: number): string => {
  if (rating <= 2) return "ratingLabels.veryBad";
  if (rating <= 4) return "ratingLabels.bad";
  if (rating <= 5) return "ratingLabels.average";
  if (rating <= 6) return "ratingLabels.acceptable";
  if (rating <= 7) return "ratingLabels.good";
  if (rating <= 8) return "ratingLabels.veryGood";
  if (rating <= 9) return "ratingLabels.excellent";
  return "ratingLabels.masterpiece";
};

export const QuickRating = ({
  currentRating,
  onRate,
  disabled = false,
  size = "sm",
}: QuickRatingProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState<number>(currentRating ?? 7);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && currentRating !== null) {
      setLocalValue(currentRating);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onRate(localValue);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
            "hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            textSize
          )}
          title={currentRating ? t("bookCard.yourRating", { rating: currentRating }) : t("bookCard.rateBook")}
        >
          <Star
            className={cn(
              iconSize,
              currentRating ? "fill-accent text-accent" : "text-muted-foreground"
            )}
          />
          {currentRating ? (
            <span className="font-semibold text-foreground">{currentRating}</span>
          ) : (
            <span className="text-muted-foreground">{t("bookCard.rate")}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="text-center">
            <span className={cn("text-3xl font-bold", getRatingColor(localValue))}>
              {localValue.toFixed(1)}
            </span>
            <span className="text-muted-foreground">/10</span>
            <p className={cn("text-sm font-medium mt-1", getRatingColor(localValue))}>
              {t(getRatingLabelKey(localValue))}
            </p>
          </div>

          <Slider
            value={[localValue]}
            onValueChange={(v) => setLocalValue(v[0])}
            min={1}
            max={10}
            step={0.5}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {currentRating ? t("bookCard.updateRating") : t("bookCard.saveRating")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
