import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { MonthlyStats } from "@/hooks/useReadingStats";
import { useTranslation } from "react-i18next";

interface MonthlyReadingChartProps {
  data: MonthlyStats[];
  themeColor?: string;
}

const getBarColor = (themeColor: string) => {
  const colors: Record<string, string> = {
    orange: "hsl(24, 95%, 53%)",
    amber: "hsl(45, 93%, 47%)",
    emerald: "hsl(160, 84%, 39%)",
    blue: "hsl(217, 91%, 60%)",
    violet: "hsl(263, 70%, 50%)",
    rose: "hsl(346, 77%, 49%)",
  };
  return colors[themeColor] || colors.orange;
};

export const MonthlyReadingChart: React.FC<MonthlyReadingChartProps> = ({ 
  data, 
  themeColor = "orange" 
}) => {
  const { t } = useTranslation();
  const currentMonth = new Date().getMonth();
  const barColor = getBarColor(themeColor);
  const maxBooks = Math.max(...data.map(d => d.books), 1);

  const monthNames = t("stats.monthNames", { returnObjects: true }) as string[];
  const localizedData = data.map((d, i) => ({
    ...d,
    monthLabel: monthNames[i] || d.monthLabel,
  }));

  return (
    <Card className="p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t("stats.booksPerMonth")}</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date().getFullYear()}
        </span>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={localizedData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis 
              dataKey="monthLabel" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, Math.max(maxBooks + 1, 5)]}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`${value} ${t("stats.books")}`, t("stats.read")]}
            />
            <Bar 
              dataKey="books" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {localizedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={index === currentMonth ? barColor : `${barColor}66`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.every(d => d.books === 0) && (
        <p className="text-sm text-muted-foreground text-center mt-2">
          {t("stats.noGenreData")}
        </p>
      )}
    </Card>
  );
};
