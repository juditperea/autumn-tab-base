import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, BookOpen, Target, Award } from "lucide-react";

const Profile = () => {
  const stats = [
    { label: "Libros leídos", value: 42, icon: BookOpen },
    { label: "Objetivo anual", value: "50/60", icon: Target },
    { label: "Insignias", value: 8, icon: Award },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Perfil</h1>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <Card className="p-6 text-center shadow-card">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-autumn" />
          <h2 className="text-2xl font-bold text-foreground mb-1">María</h2>
          <p className="text-muted-foreground mb-4">@maria_lectora</p>
          <p className="text-sm text-foreground">
            Amante de la fantasía y el young adult 📚✨
          </p>
        </Card>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 text-center shadow-card">
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </section>

        {/* Reading Activity */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Actividad reciente
          </h3>
          <Card className="p-6 text-center shadow-card">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Tu actividad aparecerá aquí
            </p>
          </Card>
        </section>

        {/* Favorite Genres */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Géneros favoritos
          </h3>
          <div className="flex flex-wrap gap-2">
            {["Fantasía", "Young Adult", "Romance", "Thriller"].map((genre) => (
              <span
                key={genre}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;
