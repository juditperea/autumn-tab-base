import React, { useState } from "react";
import { Award, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAchievements, Achievement } from "@/hooks/useAchievements";
import { AchievementBadge } from "./AchievementBadge";

interface AchievementsSectionProps {
  userId?: string;
}

const CATEGORY_LABELS: Record<Achievement["category"], string> = {
  reading: "Lectura",
  social: "Social",
  explorer: "Explorador",
  streak: "Rachas",
  special: "Especiales",
};

const CATEGORY_ORDER: Achievement["category"][] = [
  "reading",
  "streak",
  "explorer",
  "social",
  "special",
];

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ userId }) => {
  const { data: achievements, isLoading, error } = useAchievements(userId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="w-14 h-14 rounded-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (error || !achievements) {
    return null;
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  // Group achievements by category
  const groupedUnlocked = CATEGORY_ORDER.reduce((acc, category) => {
    const categoryAchievements = unlockedAchievements.filter(a => a.category === category);
    if (categoryAchievements.length > 0) {
      acc[category] = categoryAchievements;
    }
    return acc;
  }, {} as Record<string, Achievement[]>);

  const groupedLocked = CATEGORY_ORDER.reduce((acc, category) => {
    const categoryAchievements = lockedAchievements.filter(a => a.category === category);
    if (categoryAchievements.length > 0) {
      acc[category] = categoryAchievements;
    }
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <Card className="p-4 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Logros
          <span className="text-sm font-normal text-muted-foreground">
            ({unlockedAchievements.length}/{achievements.length})
          </span>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
        >
          {expanded ? (
            <>
              Ver menos <ChevronUp className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              Ver todos <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* Unlocked achievements summary */}
      {unlockedAchievements.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aún no has desbloqueado ningún logro. ¡Sigue leyendo! 📚
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-2">
          {unlockedAchievements.slice(0, expanded ? undefined : 8).map(achievement => (
            <AchievementBadge key={achievement.id} achievement={achievement} size="md" />
          ))}
          {!expanded && unlockedAchievements.length > 8 && (
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center text-sm font-medium text-muted-foreground">
              +{unlockedAchievements.length - 8}
            </div>
          )}
        </div>
      )}

      {/* Expanded view with all achievements */}
      {expanded && (
        <div className="mt-6 space-y-4 border-t border-border pt-4">
          <p className="text-sm font-medium text-muted-foreground">Por desbloquear</p>
          
          {Object.entries(groupedLocked).map(([category, categoryAchievements]) => (
            <div key={category}>
              <p className="text-xs text-muted-foreground mb-2">
                {CATEGORY_LABELS[category as Achievement["category"]]}
              </p>
              <div className="flex flex-wrap gap-2">
                {categoryAchievements.map(achievement => (
                  <AchievementBadge 
                    key={achievement.id} 
                    achievement={achievement} 
                    size="sm"
                    showProgress
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
