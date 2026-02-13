import { useState, useEffect, useRef } from "react";
import { useClubMessages, useSendClubMessage, useDeleteClubMessage, type ClubMessage } from "@/hooks/useClubs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, AlertTriangle, MoreVertical, Trash2, Eye, EyeOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ClubChatProps {
  clubId: string;
  isAdmin: boolean;
}

export const ClubChat = ({ clubId, isAdmin }: ClubChatProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useClubMessages(clubId);
  const { mutate: sendMessage, isPending: isSending } = useSendClubMessage();
  const { mutate: deleteMessage } = useDeleteClubMessage();

  const [content, setContent] = useState("");
  const [containsSpoiler, setContainsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dateFnsLocale = i18n.language.startsWith("es") ? es : enUS;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`club-messages-${clubId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "club_messages", filter: `club_id=eq.${clubId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["club", clubId, "messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clubId, queryClient]);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage({ clubId, content: content.trim(), containsSpoiler }, {
      onSuccess: () => { setContent(""); setContainsSpoiler(false); },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleSpoilerReveal = (messageId: string) => {
    setRevealedSpoilers((prev) => {
      const next = new Set(prev);
      next.has(messageId) ? next.delete(messageId) : next.add(messageId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("clubs.noMessages")}</p>
            <p className="text-sm">{t("clubs.beFirstMessage")}</p>
          </div>
        )}
        {messages?.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.user_id === user?.id}
            isAdmin={isAdmin}
            isSpoilerRevealed={revealedSpoilers.has(msg.id)}
            onToggleSpoiler={() => toggleSpoilerReveal(msg.id)}
            onDelete={() => deleteMessage({ messageId: msg.id, clubId })}
            dateFnsLocale={dateFnsLocale}
            t={t}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 space-y-3 bg-card">
        <Textarea
          placeholder={t("clubs.writeMessage")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="spoiler" checked={containsSpoiler} onCheckedChange={(checked) => setContainsSpoiler(checked === true)} />
            <Label htmlFor="spoiler" className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t("clubs.containsSpoiler")}
            </Label>
          </div>
          <Button onClick={handleSend} disabled={!content.trim() || isSending} size="sm">
            <Send className="w-4 h-4 mr-1" />
            {t("clubs.send")}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ClubMessage;
  isOwn: boolean;
  isAdmin: boolean;
  isSpoilerRevealed: boolean;
  onToggleSpoiler: () => void;
  onDelete: () => void;
  dateFnsLocale: typeof es;
  t: (key: string) => string;
}

const MessageBubble = ({ message, isOwn, isAdmin, isSpoilerRevealed, onToggleSpoiler, onDelete, dateFnsLocale, t }: MessageBubbleProps) => {
  const canDelete = isOwn || isAdmin;
  const showSpoilerBlur = message.contains_spoiler && !isSpoilerRevealed;

  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
      <Link to={`/perfil/${message.profile?.username}`}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{message.profile?.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
      </Link>
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-2 mb-1">
          <Link to={`/perfil/${message.profile?.username}`} className="text-sm font-medium hover:underline">
            {message.profile?.full_name || message.profile?.username}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: dateFnsLocale })}
          </span>
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-3 h-3" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("clubs.deleteMessage")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className={`relative rounded-lg px-3 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {message.contains_spoiler && (
            <div className="flex items-center gap-1 text-xs mb-1 opacity-70">
              <AlertTriangle className="w-3 h-3" />
              <span>{t("clubs.spoiler")}</span>
              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs" onClick={onToggleSpoiler}>
                {isSpoilerRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </div>
          )}
          <p className={`text-sm whitespace-pre-wrap break-words ${showSpoilerBlur ? "blur-sm select-none" : ""}`}>
            {message.content}
          </p>
          {showSpoilerBlur && (
            <button onClick={onToggleSpoiler} className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium bg-background/80 px-2 py-1 rounded">{t("clubs.showSpoiler")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};