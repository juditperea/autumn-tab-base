import React from "react";
import { BarChart3 } from "lucide-react";
import { useReadingStats } from "@/hooks/useReadingStats";
import { StatsOverviewCards } from "./StatsOverviewCards";
import { MonthlyReadingChart } from "./MonthlyReadingChart";
import { GenreDistributionChart } from "./GenreDistributionChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface ReadingStatsSectionProps {
  userId?: string;
  themeColor?: string;
}

export const ReadingStatsSection: React.FC<ReadingStatsSectionProps> = ({ userId, themeColor = "orange" }) => {
  const { t } = useTranslation();
  const { data: stats, isLoading, error } = useReadingStats(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-56" /><Skeleton className="h-56" />
      </div>
    );
  }

  if (error || !stats) {
    return <Card className="p-6 text-center"><p className="text-muted-foreground">{t("stats.couldNotLoad")}</p></Card>;
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />{t("stats.title")}
      </h3>
      <StatsOverviewCards stats={stats} themeColor={themeColor} />
      <MonthlyReadingChart data={stats.monthlyStats} themeColor={themeColor} />
      <GenreDistributionChart data={stats.genreStats} themeColor={themeColor} />
      {stats.topGenre && (
        <Card className="p-4 shadow-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-xl">📚</span></div>
            <div>
              <p className="text-sm text-muted-foreground">{t("stats.favoriteGenre")}</p>
              <p className="font-semibold text-foreground">{stats.topGenre.charAt(0).toUpperCase() + stats.topGenre.slice(1)}</p>
            </div>
          </div>
        </Card>
      )}
      <Card className="p-4 shadow-card">
        <h4 className="font-medium text-foreground mb-3">{t("stats.fullHistory")}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground">{t("stats.totalBooks")}</p><p className="text-lg font-semibold text-foreground">{stats.totalBooks}</p></div>
          <div><p className="text-muted-foreground">{t("stats.totalPages")}</p><p className="text-lg font-semibold text-foreground">{stats.totalPages.toLocaleString()}</p></div>
        </div>
      </Card>
    </section>
  );
};
