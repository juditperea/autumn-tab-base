import React, { useState } from "react";
import { Target, Trophy, Lock, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSetReadingGoal } from "@/hooks/useReadingGoal";
import { useTranslation } from "react-i18next";

interface ReadingGoalCardProps {
  readingGoal: number | null;
  readingGoalYear: number | null;
  booksRead: number;
  isOwner?: boolean;
}

export const ReadingGoalCard: React.FC<ReadingGoalCardProps> = ({
  readingGoal,
  readingGoalYear,
  booksRead,
  isOwner = false,
}) => {
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [goalInput, setGoalInput] = useState("20");
  const setGoalMutation = useSetReadingGoal();

  const currentYear = new Date().getFullYear();
  const hasGoalThisYear = readingGoalYear === currentYear;
  const progress = hasGoalThisYear && readingGoal ? Math.min((booksRead / readingGoal) * 100, 100) : 0;
  const isCompleted = hasGoalThisYear && readingGoal && booksRead >= readingGoal;

  const handleSetGoal = async () => {
    const goal = parseInt(goalInput);
    if (goal > 0 && goal <= 500) {
      await setGoalMutation.mutateAsync(goal);
      setShowDialog(false);
    }
  };

  if (!hasGoalThisYear && isOwner) {
    return (
      <>
        <Card className="p-4 shadow-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                {t("readingGoal.challenge", { year: currentYear })}
              </h3>
              <p className="text-sm text-muted-foreground mb-3" dangerouslySetInnerHTML={{ __html: t("readingGoal.fixedWarning") }} />
              <Button onClick={() => setShowDialog(true)} className="gradient-autumn text-white" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                {t("readingGoal.setGoal")}
              </Button>
            </div>
          </div>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {t("readingGoal.yourChallenge", { year: currentYear })}
              </DialogTitle>
              <DialogDescription dangerouslySetInnerHTML={{ __html: t("readingGoal.fixedNote") }} />
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">{t("readingGoal.numberOfBooks")}</label>
              <Input type="number" min="1" max="500" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="text-2xl text-center font-bold" />
              <p className="text-xs text-muted-foreground mt-2 text-center">{t("readingGoal.recommendation")}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>{t("readingGoal.cancel")}</Button>
              <Button onClick={handleSetGoal} disabled={setGoalMutation.isPending} className="gradient-autumn text-white">
                <Lock className="w-4 h-4 mr-2" />
                {t("readingGoal.confirmGoal")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (hasGoalThisYear && readingGoal) {
    return (
      <Card className={`p-4 shadow-card ${isCompleted ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {isCompleted ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Target className="w-5 h-5 text-primary" />}
            {t("readingGoal.challengeShort", { year: currentYear })}
          </h3>
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {t("readingGoal.fixed")}
          </span>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t("readingGoal.progress")}</span>
            <span className="font-semibold text-foreground">{t("readingGoal.booksCount", { read: booksRead, goal: readingGoal })}</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
        {isCompleted ? (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">{t("readingGoal.completed")}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("readingGoal.remaining", { count: readingGoal - booksRead })}</p>
        )}
      </Card>
    );
  }

  return null;
};
