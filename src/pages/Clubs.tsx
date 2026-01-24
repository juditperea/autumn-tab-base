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

const Clubs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: myClubs, isLoading: myClubsLoading } = useMyClubs();
  const { data: publicClubs, isLoading: publicClubsLoading } = usePublicClubs();

  // Filter out clubs user is already a member of
  const discoverClubs = publicClubs?.filter(
    (pub) => !myClubs?.some((my) => my.id === pub.id)
  );

  // Filter clubs based on search query
  const filteredMyClubs = useMemo(() => {
    if (!searchQuery.trim()) return myClubs;
    const query = searchQuery.toLowerCase();
    return myClubs?.filter(
      (club) =>
        club.name.toLowerCase().includes(query) ||
        club.description?.toLowerCase().includes(query)
    );
  }, [myClubs, searchQuery]);

  const filteredDiscoverClubs = useMemo(() => {
    if (!searchQuery.trim()) return discoverClubs;
    const query = searchQuery.toLowerCase();
    return discoverClubs?.filter(
      (club) =>
        club.name.toLowerCase().includes(query) ||
        club.description?.toLowerCase().includes(query)
    );
  }, [discoverClubs, searchQuery]);

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

      {/* Search Bar */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clubs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

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
          ) : filteredMyClubs?.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No se encontraron clubs" : "Aún no perteneces a ningún club"}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground mt-1">
                  ¡Crea uno o únete a uno público!
                </p>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredMyClubs?.map((club) => (
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
          ) : filteredDiscoverClubs?.length === 0 ? (
            <Card className="p-8 text-center shadow-card">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-foreground mb-2">
                {searchQuery ? "No se encontraron clubs" : "No hay más clubs públicos"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Intenta con otro término de búsqueda" : "¡Sé el primero en crear uno nuevo!"}
              </p>
              {!searchQuery && (
                <CreateClubDialog
                  trigger={
                    <Button className="w-full shadow-warm">Crear club</Button>
                  }
                />
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredDiscoverClubs?.map((club) => (
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
