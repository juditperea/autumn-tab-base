import React, { useState } from "react";
import { Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFollowers, useFollowing } from "@/hooks/useFollows";
import { FollowButton } from "@/components/social/FollowButton";
import { useAuth } from "@/contexts/AuthContext";

interface FollowersModalProps {
  userId: string;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "followers" | "following";
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  userId,
  username,
  open,
  onOpenChange,
  initialTab = "followers",
}) => {
  const { user } = useAuth();
  const { data: followers, isLoading: loadingFollowers } = useFollowers(userId);
  const { data: following, isLoading: loadingFollowing } = useFollowing(userId);

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
              Seguidores ({followers?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="following">
              Siguiendo ({following?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers">
            <ScrollArea className="h-[300px] pr-3">
              {loadingFollowers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : followers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Aún no tienes seguidores</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {followers?.map((follow) => (
                    <div
                      key={follow.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Link
                        to={`/perfil/${follow.follower?.username}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={follow.follower?.avatar_url ?? undefined} />
                          <AvatarFallback className="gradient-autumn text-white">
                            {follow.follower?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {follow.follower?.full_name || follow.follower?.username}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            @{follow.follower?.username}
                          </p>
                        </div>
                      </Link>
                      {user && follow.follower?.id && follow.follower.id !== user.id && (
                        <FollowButton targetUserId={follow.follower.id} size="sm" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="following">
            <ScrollArea className="h-[300px] pr-3">
              {loadingFollowing ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : following?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No sigues a nadie aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {following?.map((follow) => (
                    <div
                      key={follow.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Link
                        to={`/perfil/${follow.following?.username}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={follow.following?.avatar_url ?? undefined} />
                          <AvatarFallback className="gradient-autumn text-white">
                            {follow.following?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {follow.following?.full_name || follow.following?.username}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            @{follow.following?.username}
                          </p>
                        </div>
                      </Link>
                      {user && follow.following?.id && follow.following.id !== user.id && (
                        <FollowButton targetUserId={follow.following.id} size="sm" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
