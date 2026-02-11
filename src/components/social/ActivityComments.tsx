import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import {
  useActivityComments,
  useAddActivityComment,
  useDeleteActivityComment,
} from "@/hooks/useActivityInteractions";
import { useTranslation } from "react-i18next";

interface ActivityCommentsProps {
  activityId: string;
}

export const ActivityComments = ({ activityId }: ActivityCommentsProps) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const dateLocale = i18n.language.startsWith("en") ? enUS : es;

  const { data: comments, isLoading } = useActivityComments(activityId);
  const addComment = useAddActivityComment();
  const deleteComment = useDeleteActivityComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    await addComment.mutateAsync({
      activityId,
      content: newComment.trim(),
    });
    setNewComment("");
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment.mutateAsync(commentId);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => setIsExpanded(true)}
      >
        {comments && comments.length > 0
          ? t(comments.length > 1 ? "activity.viewComments_plural" : "activity.viewComments", { count: comments.length })
          : t("activity.comment")}
      </Button>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <Link to={`/perfil/${comment.profile?.username}`}>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={comment.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {comment.profile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Link
                    to={`/perfil/${comment.profile?.username}`}
                    className="text-xs font-medium hover:underline"
                  >
                    {comment.profile?.full_name || comment.profile?.username}
                  </Link>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteComment.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xs gradient-autumn text-white">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("activity.writeComment")}
              className="min-h-[36px] h-9 py-2 resize-none text-sm"
              rows={1}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || addComment.isPending}
              className="h-9 px-3"
            >
              {addComment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground text-center">
          <Link to="/auth" className="text-primary hover:underline">
            {t("activity.loginToComment")}
          </Link>{" "}
          {t("activity.toComment")}
        </p>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground"
        onClick={() => setIsExpanded(false)}
      >
        {t("activity.hideComments")}
      </Button>
    </div>
  );
};
