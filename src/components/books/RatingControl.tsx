import { useState } from "react";
import { Slider } from "@/components/ui/slider";
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
  const displayValue = value ?? localValue;

  const handleChange = (newValue: number[]) => {
    const rating = newValue[0];
    setLocalValue(rating);
    onChange(rating);
  };

  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <span className={cn("font-bold", sizeClasses[size], getRatingColor(displayValue))}>
          {displayValue.toFixed(1)}
        </span>
        <span className="text-muted-foreground">/10</span>
      </div>
      
      <p className={cn(
        "text-center font-medium",
        getRatingColor(displayValue)
      )}>
        {getRatingLabel(displayValue)}
      </p>

      <Slider
        value={[displayValue]}
        onValueChange={handleChange}
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

      {value === null && (
        <button
          onClick={() => onChange(null)}
          className="text-xs text-muted-foreground hover:text-foreground underline mx-auto block"
        >
          Quitar puntuación
        </button>
      )}
    </div>
  );
};
