import { useState, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, Search } from "lucide-react";
import { useMyClubs, usePublicClubs } from "@/hooks/useClubs";
import { ClubCard } from "@/components/clubs/ClubCard";
import { CreateClubDialog } from "@/components/clubs/CreateClubDialog";
import { useTranslation } from "react-i18next";

const Clubs = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: myClubs, isLoading: myClubsLoading } = useMyClubs();
  const { data: publicClubs, isLoading: publicClubsLoading } = usePublicClubs();

  const discoverClubs = publicClubs?.filter((pub) => !myClubs?.some((my) => my.id === pub.id));

  const filteredMyClubs = useMemo(() => {
    if (!searchQuery.trim()) return myClubs;
    const query = searchQuery.toLowerCase();
    return myClubs?.filter((club) => club.name.toLowerCase().includes(query) || club.description?.toLowerCase().includes(query));
  }, [myClubs, searchQuery]);

  const filteredDiscoverClubs = useMemo(() => {
    if (!searchQuery.trim()) return discoverClubs;
    const query = searchQuery.toLowerCase();
    return discoverClubs?.filter((club) => club.name.toLowerCase().includes(query) || club.description?.toLowerCase().includes(query));
  }, [discoverClubs, searchQuery]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">{t("clubs.title")}</h1>
          <div className="flex items-center gap-2">
            <CreateClubDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("clubs.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("clubs.myClubs")}</h2>
          {myClubsLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="p-4"><div className="flex gap-4"><Skeleton className="w-16 h-16 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-40" /></div></div></Card>
              ))}
            </div>
          ) : filteredMyClubs?.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? t("clubs.noClubsFound") : t("clubs.notMemberYet")}
              </p>
              {!searchQuery && <p className="text-xs text-muted-foreground mt-1">{t("clubs.createOrJoin")}</p>}
            </Card>
          ) : (
            <div className="space-y-3">{filteredMyClubs?.map((club) => <ClubCard key={club.id} club={club} />)}</div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("clubs.discoverClubs")}</h2>
          {publicClubsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4"><div className="flex gap-4"><Skeleton className="w-16 h-16 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-24" /></div></div></Card>
              ))}
            </div>
          ) : filteredDiscoverClubs?.length === 0 ? (
            <Card className="p-8 text-center shadow-card">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-foreground mb-2">
                {searchQuery ? t("clubs.noClubsFound") : t("clubs.noMorePublic")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? t("clubs.tryOtherSearch") : t("clubs.beFirst")}
              </p>
              {!searchQuery && <CreateClubDialog trigger={<Button className="w-full shadow-warm">{t("clubs.createClub")}</Button>} />}
            </Card>
          ) : (
            <div className="space-y-3">{filteredDiscoverClubs?.map((club) => <ClubCard key={club.id} club={club} />)}</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Clubs;
