import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, BookOpen } from "lucide-react";

const Clubs = () => {
  const myClubs = [
    {
      id: 1,
      name: "Fantasía Épica",
      members: 234,
      currentBook: "El nombre del viento",
      color: "from-orange-500 to-amber-500",
    },
    {
      id: 2,
      name: "Clásicos Modernos",
      members: 156,
      currentBook: "1984",
      color: "from-green-600 to-teal-600",
    },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Clubs</h1>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="rounded-full">
              <Plus className="w-5 h-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Clubs Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* My Clubs */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Mis clubs</h2>
          <div className="space-y-3">
            {myClubs.map((club) => (
              <Card key={club.id} className="p-4 shadow-card hover:shadow-warm tab-transition cursor-pointer">
                <div className="flex gap-4">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${club.color} flex items-center justify-center`}>
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{club.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {club.members} miembros
                    </p>
                    <div className="flex items-center gap-1 text-xs text-secondary">
                      <BookOpen className="w-3 h-3" />
                      <span>Leyendo: {club.currentBook}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Discover Clubs */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Descubre clubs
          </h2>
          <Card className="p-8 text-center shadow-card">
            <Users className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold text-foreground mb-2">
              Encuentra tu comunidad
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Explora clubs según tus géneros favoritos
            </p>
            <Button className="w-full shadow-warm">
              Explorar clubs
            </Button>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Clubs;
