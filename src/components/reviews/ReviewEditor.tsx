import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Send, AlertTriangle } from "lucide-react";
import { useCreateReview, useUpdateReview } from "@/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ReviewEditorProps {
  bookId: string;
  existingReview?: {
    id: string;
    content: string;
    contains_spoiler: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MAX_LENGTH = 5000;

export const ReviewEditor = ({ bookId, existingReview, onSuccess, onCancel }: ReviewEditorProps) => {
  const { t } = useTranslation();
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [containsSpoiler, setContainsSpoiler] = useState(existingReview?.contains_spoiler ?? false);
  
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const { toast } = useToast();

  const isEditing = !!existingReview;
  const isPending = createReview.isPending || updateReview.isPending;
  const charCount = content.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = async () => {
    if (isEmpty || isOverLimit) return;
    try {
      if (isEditing) {
        await updateReview.mutateAsync({ id: existingReview.id, content, containsSpoiler });
        toast({ title: t("review.updated"), description: t("review.updatedDesc") });
      } else {
        await createReview.mutateAsync({ bookId, content, containsSpoiler });
        toast({ title: t("review.published"), description: t("review.publishedDesc") });
      }
      onSuccess?.();
    } catch {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: isEditing ? t("review.updateError") : t("review.publishError"),
      });
    }
  };

  return (
    <Card className="p-4 shadow-card">
      <h4 className="font-semibold text-foreground mb-3">
        {isEditing ? t("review.editReview") : t("review.writeReview")}
      </h4>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("review.placeholder")}
        className="min-h-[120px] resize-y"
        maxLength={MAX_LENGTH + 100}
      />

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className={isOverLimit ? "text-destructive" : ""}>{charCount}/{MAX_LENGTH}</span>
        {isOverLimit && (
          <span className="text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {t("review.tooLong")}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2 mt-4">
        <Checkbox id="spoiler" checked={containsSpoiler} onCheckedChange={(checked) => setContainsSpoiler(checked as boolean)} />
        <Label htmlFor="spoiler" className="text-sm cursor-pointer">{t("review.containsSpoilers")}</Label>
      </div>

      <div className="flex gap-2 mt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isPending}>{t("common.cancel")}</Button>
        )}
        <Button onClick={handleSubmit} disabled={isPending || isEmpty || isOverLimit} className="flex-1">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? t("review.saving") : t("review.publishing")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isEditing ? t("review.saveChanges") : t("review.publish")}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};