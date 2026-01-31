import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { GenreStats } from "@/hooks/useReadingStats";

interface GenreDistributionChartProps {
  data: GenreStats[];
  themeColor?: string;
}

const GENRE_COLORS = [
  "hsl(24, 95%, 53%)",   // orange
  "hsl(45, 93%, 47%)",   // amber
  "hsl(160, 84%, 39%)",  // emerald
  "hsl(217, 91%, 60%)",  // blue
  "hsl(263, 70%, 50%)",  // violet
  "hsl(346, 77%, 49%)",  // rose
  "hsl(173, 80%, 40%)",  // teal
  "hsl(280, 65%, 60%)",  // purple
];

// Map English genres to Spanish
const genreTranslations: Record<string, string> = {
  "fiction": "Ficción",
  "fantasy": "Fantasía",
  "romance": "Romance",
  "mystery": "Misterio",
  "thriller": "Thriller",
  "science fiction": "Ciencia Ficción",
  "horror": "Terror",
  "historical fiction": "Ficción Histórica",
  "literary fiction": "Ficción Literaria",
  "young adult": "Juvenil",
  "children": "Infantil",
  "biography": "Biografía",
  "memoir": "Memorias",
  "self-help": "Autoayuda",
  "history": "Historia",
  "science": "Ciencia",
  "philosophy": "Filosofía",
  "poetry": "Poesía",
  "classics": "Clásicos",
  "contemporary": "Contemporáneo",
  "adventure": "Aventura",
  "crime": "Crimen",
  "dystopian": "Distopía",
  "magical realism": "Realismo Mágico",
  "nonfiction": "No Ficción",
  "non-fiction": "No Ficción",
};

const translateGenre = (genre: string): string => {
  const lower = genre.toLowerCase();
  return genreTranslations[lower] || genre;
};

export const GenreDistributionChart: React.FC<GenreDistributionChartProps> = ({ data }) => {
  const chartData = data.map(d => ({
    ...d,
    displayName: translateGenre(d.genre),
  }));

  if (data.length === 0) {
    return (
      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Géneros leídos</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Aún no hay suficientes datos de géneros
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Géneros leídos</h3>
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
              formatter={(value: number, name: string) => [`${value} libros`, name]}
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
