import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { GenreStats } from "@/hooks/useReadingStats";
import { useTranslation } from "react-i18next";

interface GenreDistributionChartProps {
  data: GenreStats[];
  themeColor?: string;
}

const GENRE_COLORS = [
  "hsl(24, 95%, 53%)",   // orange — ficción
  "hsl(160, 84%, 39%)",  // emerald — juvenil
  "hsl(217, 91%, 60%)",  // blue — no ficción
  "hsl(346, 77%, 49%)",  // rose — misterio y thriller
  "hsl(340, 65%, 62%)",  // pink — romance
  "hsl(263, 70%, 50%)",  // violet — fantasía
  "hsl(200, 80%, 50%)",  // cyan — ciencia ficción
  "hsl(0, 72%, 45%)",    // red — terror
  "hsl(45, 93%, 47%)",   // amber — histórica
  "hsl(30, 60%, 42%)",   // brown — drama
  "hsl(280, 65%, 60%)",  // purple — poesía
  "hsl(173, 80%, 40%)",  // teal — ensayo
  "hsl(50, 80%, 55%)",   // gold — biografía
  "hsl(142, 60%, 45%)",  // green — educación
  "hsl(190, 70%, 50%)",  // sky — cómic y novela gráfica
];

// Genres are already normalized and translated by genreNormalizer.
// Just capitalize first letter for display if needed.
// Removed — now handled inline with i18n

export const GenreDistributionChart: React.FC<GenreDistributionChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const chartData = data.map(d => ({
    ...d,
    displayName: t(`canonicalGenres.${d.genre}`, d.genre.charAt(0).toUpperCase() + d.genre.slice(1)),
  }));

  if (data.length === 0) {
    return (
      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("stats.genresRead")}</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("stats.noGenreDataShort")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t("stats.genresRead")}</h3>
      </div>
      
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="displayName"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
            >
              {chartData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [`${value} ${t("stats.books")}`, name]}
            />
            <Legend 
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
