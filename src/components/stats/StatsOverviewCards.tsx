import React from "react";
import { Card } from "@/components/ui/card";
import { BookOpen, FileText, Star, Flame } from "lucide-react";
import { ReadingStats } from "@/hooks/useReadingStats";
import { useTranslation } from "react-i18next";

interface StatsOverviewCardsProps {
  stats: ReadingStats;
  themeColor?: string;
}

export const StatsOverviewCards: React.FC<StatsOverviewCardsProps> = ({ stats, themeColor = "orange" }) => {
  const { t } = useTranslation();

  const overviewStats = [
    { label: t("stats.booksThisYear"), value: stats.booksThisYear, icon: BookOpen, color: "text-primary" },
    { label: t("stats.pagesRead"), value: stats.pagesThisYear.toLocaleString(), icon: FileText, color: "text-blue-500" },
    { label: t("stats.averageRating"), value: stats.averageRating > 0 ? `${stats.averageRating}/10` : "—", icon: Star, color: "text-yellow-500" },
    { label: t("stats.monthStreak"), value: stats.currentStreak > 0 ? `${stats.currentStreak} 🔥` : "0", icon: Flame, color: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {overviewStats.map((stat, index) => (
        <Card key={index} className="p-3 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-xl font-bold text-foreground">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
};
