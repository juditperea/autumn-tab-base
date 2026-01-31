import React from "react";
import { cn } from "@/lib/utils";
import { Achievement } from "@/hooks/useAchievements";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = "md",
  showProgress = false,
}) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-2xl",
    lg: "w-20 h-20 text-4xl",
  };

  const progressPercent = 
    achievement.progress !== undefined && achievement.target !== undefined
      ? Math.min((achievement.progress / achievement.target) * 100, 100)
      : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "rounded-full flex items-center justify-center transition-all",
                sizeClasses[size],
                achievement.unlocked
                  ? "bg-gradient-to-br from-primary/20 to-secondary/20 ring-2 ring-primary/50 shadow-lg"
                  : "bg-muted/50 grayscale opacity-50"
              )}
            >
              <span className={achievement.unlocked ? "" : "opacity-50"}>
                {achievement.icon}
              </span>
            </div>
            {showProgress && !achievement.unlocked && achievement.target && (
              <div className="w-full max-w-[60px]">
                <Progress value={progressPercent} className="h-1" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-center">
          <p className="font-semibold">{achievement.name}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
          {!achievement.unlocked && achievement.progress !== undefined && achievement.target !== undefined && (
            <p className="text-xs text-primary mt-1">
              {achievement.progress} / {achievement.target}
            </p>
          )}
          {achievement.unlocked && (
            <p className="text-xs text-green-500 mt-1">✓ Desbloqueado</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
