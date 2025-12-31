import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Trash2, Send } from "lucide-react";
import { useReviewComments, useCreateComment, useDeleteComment } from "@/hooks/useReviewComments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReviewCommentsProps {
  reviewId: string;
}

export const ReviewComments = ({ reviewId }: ReviewCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { data: comments, isLoading } = useReviewComments(showComments ? reviewId : undefined);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        reviewId,
        content: newComment.trim(),
      });
      setNewComment("");
      toast({ title: "Comentario publicado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo publicar el comentario",
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId, reviewId });
      toast({ title: "Comentario eliminado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el comentario",
      });
    }
  };

  const commentsCount = comments?.length ?? 0;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground tab-transition"
      >
        <MessageCircle className="w-4 h-4" />
        {showComments ? "Ocultar comentarios" : `Comentarios${commentsCount > 0 ? ` (${commentsCount})` : ""}`}
      </button>

      {showComments && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Comment list */}
              {comments && comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarImage src={comment.profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {comment.profile?.username?.charAt(0).toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {comment.profile?.full_name || comment.profile?.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                          {user?.id === comment.user_id && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="ml-auto text-muted-foreground hover:text-destructive"
                              disabled={deleteComment.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No hay comentarios aún. ¡Sé el primero!
                </p>
              )}

              {/* New comment form */}
              {user && (
                <div className="flex gap-2 pt-2">
                  <Textarea
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                    maxLength={1000}
                  />
                  <Button
                    size="icon"
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || createComment.isPending}
                  >
                    {createComment.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
