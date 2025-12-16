import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookOpen, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { ReadingStatus } from "@/hooks/useUserBooks";

interface StatusSelectorProps {
  value: ReadingStatus | null;
  onChange: (value: ReadingStatus) => void;
  onRemove?: () => void;
  loading?: boolean;
  variant?: "select" | "buttons";
}

const statusConfig: Record<ReadingStatus, { label: string; icon: React.ElementType; color: string }> = {
  to_read: { label: "Por leer", icon: BookmarkPlus, color: "text-secondary" },
  reading: { label: "Leyendo", icon: BookOpen, color: "text-primary" },
  read: { label: "Leído", icon: CheckCircle, color: "text-accent" },
  dnf: { label: "Abandonado", icon: XCircle, color: "text-muted-foreground" },
};

export const StatusSelector = ({ 
  value, 
  onChange, 
  onRemove,
  loading = false,
  variant = "select" 
}: StatusSelectorProps) => {
  if (loading) {
    return (
      <Button disabled variant="outline" className="w-full">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Guardando...
      </Button>
    );
  }

  if (variant === "buttons") {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(statusConfig) as [ReadingStatus, typeof statusConfig[ReadingStatus]][]).map(
            ([status, config]) => {
              const Icon = config.icon;
              const isActive = value === status;
              
              return (
                <Button
                  key={status}
                  variant={isActive ? "default" : "outline"}
                  className={isActive ? "" : "hover:bg-muted"}
                  onClick={() => onChange(status)}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? "" : config.color}`} />
                  {config.label}
                </Button>
              );
            }
          )}
        </div>
        
        {value && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={onRemove}
          >
            Quitar de mi biblioteca
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select 
        value={value ?? undefined} 
        onValueChange={(v) => onChange(v as ReadingStatus)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Añadir a mi biblioteca">
            {value && (
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = statusConfig[value].icon;
                  return <Icon className={`w-4 h-4 ${statusConfig[value].color}`} />;
                })()}
                {statusConfig[value].label}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(statusConfig) as [ReadingStatus, typeof statusConfig[ReadingStatus]][]).map(
            ([status, config]) => {
              const Icon = config.icon;
              return (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    {config.label}
                  </div>
                </SelectItem>
              );
            }
          )}
        </SelectContent>
      </Select>

      {value && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={onRemove}
        >
          Quitar de mi biblioteca
        </Button>
      )}
    </div>
  );
};
