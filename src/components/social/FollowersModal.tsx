import React from "react";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFollowers, useFollowing } from "@/hooks/useFollows";
import { FollowButton } from "@/components/social/FollowButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface FollowersModalProps {
  userId: string;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "followers" | "following";
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  userId, username, open, onOpenChange, initialTab = "followers",
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: followers, isLoading: loadingFollowers } = useFollowers(userId);
  const { data: following, isLoading: loadingFollowing } = useFollowing(userId);

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  const renderUserList = (
    items: typeof followers | typeof following,
    type: "follower" | "following"
  ) => {
    if (!items?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>{type === "follower" ? t("social.noFollowersYet") : t("social.notFollowingYet")}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((follow) => {
          const profile = type === "follower" ? (follow as any).follower : (follow as any).following;
          return (
            <div key={follow.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Link
                to={`/perfil/${profile?.username}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="gradient-autumn text-white">
                    {profile?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{profile?.full_name || profile?.username}</p>
                  <p className="text-sm text-muted-foreground truncate">@{profile?.username}</p>
                </div>
              </Link>
              {user && profile?.id && profile.id !== user.id && (
                <FollowButton targetUserId={profile.id} size="sm" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            @{username}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              {t("social.followers")} ({followers?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="following">
              {t("social.following")} ({following?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers">
            <ScrollArea className="h-[300px] pr-3">
              {loadingFollowers ? renderSkeleton() : renderUserList(followers, "follower")}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="following">
            <ScrollArea className="h-[300px] pr-3">
              {loadingFollowing ? renderSkeleton() : renderUserList(following, "following")}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};