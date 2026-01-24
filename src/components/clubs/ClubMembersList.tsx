import { useClubMembers, useUpdateMemberRole, useRemoveMember, type ClubMember } from "@/hooks/useClubs";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, Shield, MoreVertical, UserMinus, ShieldCheck, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClubMembersListProps {
  clubId: string;
  isAdmin: boolean;
  ownerId: string;
}

export const ClubMembersList = ({ clubId, isAdmin, ownerId }: ClubMembersListProps) => {
  const { user } = useAuth();
  const { data: members, isLoading } = useClubMembers(clubId);
  const { mutate: updateRole } = useUpdateMemberRole();
  const { mutate: removeMember } = useRemoveMember();
  const { toast } = useToast();

  const handlePromote = (member: ClubMember) => {
    updateRole(
      { memberId: member.id, clubId, role: "admin" },
      {
        onSuccess: () => {
          toast({
            title: "Miembro promovido",
            description: `${member.profile?.username} ahora es administrador`,
          });
        },
      }
    );
  };

  const handleDemote = (member: ClubMember) => {
    updateRole(
      { memberId: member.id, clubId, role: "member" },
      {
        onSuccess: () => {
          toast({
            title: "Rol actualizado",
            description: `${member.profile?.username} ahora es miembro`,
          });
        },
      }
    );
  };

  const handleRemove = (member: ClubMember) => {
    removeMember(
      { memberId: member.id, clubId },
      {
        onSuccess: () => {
          toast({
            title: "Miembro eliminado",
            description: `${member.profile?.username} ha sido eliminado del club`,
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sortedMembers = [...(members || [])].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <div className="space-y-2 p-4">
      {sortedMembers.map((member) => {
        const isOwner = member.role === "owner";
        const isSelf = member.user_id === user?.id;
        const canManage = isAdmin && !isOwner && !isSelf && user?.id === ownerId;

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Link to={`/perfil/${member.profile?.username}`}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {member.profile?.username?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                to={`/perfil/${member.profile?.username}`}
                className="font-medium text-sm hover:underline truncate block"
              >
                {member.profile?.full_name || member.profile?.username}
              </Link>
              <p className="text-xs text-muted-foreground">
                @{member.profile?.username}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {member.role === "owner" && (
                <Badge variant="default" className="gap-1">
                  <Crown className="w-3 h-3" />
                  Creador
                </Badge>
              )}
              {member.role === "admin" && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </Badge>
              )}

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role === "member" ? (
                      <DropdownMenuItem onClick={() => handlePromote(member)}>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Hacer admin
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleDemote(member)}>
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Quitar admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRemove(member)}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Expulsar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
