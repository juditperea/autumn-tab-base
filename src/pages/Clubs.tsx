import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen } from "lucide-react";
import { useMyClubs, usePublicClubs } from "@/hooks/useClubs";
import { ClubCard } from "@/components/clubs/ClubCard";
import { CreateClubDialog } from "@/components/clubs/CreateClubDialog";

const Clubs = () => {
  const { data: myClubs, isLoading: myClubsLoading } = useMyClubs();
  const { data: publicClubs, isLoading: publicClubsLoading } = usePublicClubs();

  // Filter out clubs user is already a member of
  const discoverClubs = publicClubs?.filter(
    (pub) => !myClubs?.some((my) => my.id === pub.id)
  );

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Clubs</h1>
          <div className="flex items-center gap-2">
            <CreateClubDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Clubs Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* My Clubs */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Mis clubs</h2>

          {myClubsLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : myClubs?.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aún no perteneces a ningún club
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ¡Crea uno o únete a uno público!
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {myClubs?.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          )}
        </section>

        {/* Discover Clubs */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Descubre clubs
          </h2>

          {publicClubsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : discoverClubs?.length === 0 ? (
            <Card className="p-8 text-center shadow-card">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-foreground mb-2">
                No hay más clubs públicos
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                ¡Sé el primero en crear uno nuevo!
              </p>
              <CreateClubDialog
                trigger={
                  <Button className="w-full shadow-warm">Crear club</Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {discoverClubs?.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Clubs;
