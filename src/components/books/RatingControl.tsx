import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RatingControlProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const getRatingColor = (rating: number): string => {
  if (rating <= 3) return "text-destructive";
  if (rating <= 5) return "text-orange-500";
  if (rating <= 7) return "text-accent";
  return "text-secondary";
};

const getRatingLabel = (rating: number): string => {
  if (rating <= 2) return "Muy malo";
  if (rating <= 4) return "Malo";
  if (rating <= 5) return "Regular";
  if (rating <= 6) return "Aceptable";
  if (rating <= 7) return "Bueno";
  if (rating <= 8) return "Muy bueno";
  if (rating <= 9) return "Excelente";
  return "Obra maestra";
};

export const RatingControl = ({ 
  value, 
  onChange, 
  disabled = false,
  size = "md" 
}: RatingControlProps) => {
  const [localValue, setLocalValue] = useState<number>(value ?? 5);
  const [hasChanged, setHasChanged] = useState(false);

  // Sync with external value when it changes
  useEffect(() => {
    if (value !== null) {
      setLocalValue(value);
    }
  }, [value]);

  const handleSliderChange = (newValue: number[]) => {
    const rating = newValue[0];
    setLocalValue(rating);
    setHasChanged(true);
  };

  const handleConfirm = () => {
    onChange(localValue);
    setHasChanged(false);
  };

  const handleClear = () => {
    onChange(null);
    setLocalValue(5);
    setHasChanged(false);
  };

  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className="space-y-4">
      {/* Current saved rating indicator */}
      {value !== null && (
        <div className="text-center text-sm text-muted-foreground">
          Puntuación actual: <span className="font-semibold text-foreground">{value}/10</span>
        </div>
      )}

      {/* Display value */}
      <div className="flex items-center justify-center gap-2">
        <span className={cn("font-bold tabular-nums", sizeClasses[size], getRatingColor(localValue))}>
          {localValue.toFixed(1)}
        </span>
        <span className="text-muted-foreground">/10</span>
      </div>
      
      <p className={cn(
        "text-center font-medium",
        getRatingColor(localValue)
      )}>
        {getRatingLabel(localValue)}
      </p>

      <Slider
        value={[localValue]}
        onValueChange={handleSliderChange}
        min={1}
        max={10}
        step={0.5}
        disabled={disabled}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        {value !== null && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="flex-1"
          >
            Quitar puntuación
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={disabled || (!hasChanged && value === localValue)}
          className="flex-1"
        >
          {value === null ? "Guardar puntuación" : "Actualizar"}
        </Button>
      </div>
    </div>
  );
};
