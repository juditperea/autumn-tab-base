import React from "react";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_COLORS = [
  { id: "orange", name: "Otoño", color: "bg-orange-500", value: "orange" },
  { id: "rose", name: "Rosa", color: "bg-rose-500", value: "rose" },
  { id: "violet", name: "Violeta", color: "bg-violet-500", value: "violet" },
  { id: "blue", name: "Azul", color: "bg-blue-500", value: "blue" },
  { id: "emerald", name: "Esmeralda", color: "bg-emerald-500", value: "emerald" },
  { id: "amber", name: "Ámbar", color: "bg-amber-500", value: "amber" },
];

interface ThemeColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({
  value,
  onChange,
}) => {
  return (
    <div>
      <label className="text-sm font-medium mb-3 flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Color de perfil
      </label>
      <div className="flex flex-wrap gap-3">
        {THEME_COLORS.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.value)}
            className={cn(
              "w-10 h-10 rounded-full transition-all flex items-center justify-center",
              theme.color,
              value === theme.value
                ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                : "hover:scale-105"
            )}
            title={theme.name}
          >
            {value === theme.value && (
              <Check className="w-5 h-5 text-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export const getThemeGradient = (color: string) => {
  const gradients: Record<string, string> = {
    orange: "from-orange-500 to-amber-500",
    rose: "from-rose-500 to-pink-500",
    violet: "from-violet-500 to-purple-500",
    blue: "from-blue-500 to-cyan-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-yellow-500",
  };
  return gradients[color] || gradients.orange;
};

export const getThemeRing = (color: string) => {
  const rings: Record<string, string> = {
    orange: "ring-orange-500/30",
    rose: "ring-rose-500/30",
    violet: "ring-violet-500/30",
    blue: "ring-blue-500/30",
    emerald: "ring-emerald-500/30",
    amber: "ring-amber-500/30",
  };
  return rings[color] || rings.orange;
};
