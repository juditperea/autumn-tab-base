import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useClub, useClubMembership, useJoinClub, useLeaveClub } from "@/hooks/useClubs";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClubChat } from "@/components/clubs/ClubChat";
import { ClubMembersList } from "@/components/clubs/ClubMembersList";
import { SelectBookDialog } from "@/components/clubs/SelectBookDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  BookOpen,
  Settings,
  LogOut,
  Lock,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const ClubDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: club, isLoading: clubLoading } = useClub(id);
  const { data: membership, isLoading: membershipLoading } = useClubMembership(id);
  const { mutate: joinClub, isPending: isJoining } = useJoinClub();
  const { mutate: leaveClub, isPending: isLeaving } = useLeaveClub();

  const [activeTab, setActiveTab] = useState("chat");

  const isLoading = clubLoading || membershipLoading;
  const isMember = !!membership;
  const isAdmin = membership?.role === "owner" || membership?.role === "admin";
  const isOwner = membership?.role === "owner";

  const handleJoin = () => {
    if (!id) return;
    joinClub(id, {
      onSuccess: () => {
        toast({
          title: t("clubs.joinedClub"),
          description: t("clubs.welcomeTo", { name: club?.name }),
        });
      },
      onError: (error) => {
        toast({
          title: t("clubs.joinError"),
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleLeave = () => {
    if (!id) return;
    leaveClub(id, {
      onSuccess: () => {
        toast({ title: t("clubs.leftClub") });
        navigate("/clubs");
      },
      onError: (error) => {
        toast({
          title: t("common.error"),
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 flex-1" />
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen pb-20 bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t("clubs.clubNotFound")}</h2>
          <Button variant="outline" onClick={() => navigate("/clubs")}>
            {t("clubs.backToClubs")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/clubs")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground line-clamp-1">{club.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {club.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{club.member_count} {t("clubs.members")}</span>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        <div className="p-4 border-b border-border">
          {club.description && (
            <p className="text-sm text-muted-foreground mb-4">{club.description}</p>
          )}

          {club.current_book ? (
            <Link to={`/libro/${club.current_book.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              {club.current_book.cover_url ? (
                <img src={club.current_book.cover_url} alt={club.current_book.title} className="w-12 h-16 object-cover rounded" />
              ) : (
                <div className="w-12 h-16 bg-muted-foreground/20 rounded flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">{t("clubs.bookOfMonth")}</p>
                <p className="font-medium text-sm truncate">{club.current_book.title}</p>
                <p className="text-xs text-muted-foreground truncate">{club.current_book.authors.join(", ")}</p>
              </div>
            </Link>
          ) : (
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("clubs.noActiveBook")}</p>
            </div>
          )}

          {isAdmin && (
            <div className="mt-3">
              <SelectBookDialog
                clubId={club.id}
                currentBookId={club.current_book_id}
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    {t("clubs.changeBookOfMonth")}
                  </Button>
                }
              />
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {!isMember ? (
              club.is_public ? (
                <Button className="flex-1" onClick={handleJoin} disabled={isJoining}>
                  {isJoining ? t("clubs.joining") : t("clubs.joinClub")}
                </Button>
              ) : (
                <Badge variant="secondary" className="flex-1 justify-center py-2">
                  <Lock className="w-3 h-3 mr-1" />
                  {t("clubs.inviteOnly")}
                </Badge>
              )
            ) : (
              <>
                {!isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <LogOut className="w-4 h-4 mr-1" />
                        {t("clubs.leave")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("clubs.leaveClub")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("clubs.leaveDescription")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("clubs.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLeave} disabled={isLeaving}>
                          {isLeaving ? t("clubs.leaving") : t("clubs.confirmLeave")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Badge variant="secondary" className="flex-1 justify-center py-2">
                  {membership?.role === "owner"
                    ? t("clubs.creator")
                    : membership?.role === "admin"
                    ? t("clubs.admin")
                    : t("clubs.member")}
                </Badge>
              </>
            )}
          </div>
        </div>

        {isMember && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
              <TabsTrigger value="chat" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                <MessageCircle className="w-4 h-4 mr-2" />
                {t("clubs.chat")}
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                <Users className="w-4 h-4 mr-2" />
                {t("clubs.membersList")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0 h-[calc(100vh-380px)]">
              <ClubChat clubId={club.id} isAdmin={isAdmin} />
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <ClubMembersList clubId={club.id} isAdmin={isAdmin} ownerId={club.owner_id} />
            </TabsContent>
          </Tabs>
        )}

        {!isMember && (
          <div className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">{t("clubs.joinToParticipate")}</h3>
            <p className="text-sm text-muted-foreground">{t("clubs.accessChat")}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClubDetail;