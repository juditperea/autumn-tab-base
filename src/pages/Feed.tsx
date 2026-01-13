import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Star, TrendingUp, Award, Library, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBooks } from "@/hooks/useUserBooks";

// Curated book collections - each links to a real search with author/title that will return results
const CURATED_COLLECTIONS = [
  {
    id: "classics",
    title: "Clásicos modernos",
    icon: Star,
    description: "Obras atemporales que definieron la literatura",
    color: "text-accent",
    // Search for well-known classic authors
    searchParams: "?author=Gabriel García Márquez",
  },
  {
    id: "popular",
    title: "Los más leídos",
    icon: TrendingUp,
    description: "Libros populares en todo el mundo",
    color: "text-primary",
    // Search for bestselling authors
    searchParams: "?author=Stephen King",
  },
  {
    id: "awards",
    title: "Premios literarios",
    icon: Award,
    description: "Ganadores de premios internacionales",
    color: "text-secondary",
    // Search for Nobel/Pulitzer winners
    searchParams: "?author=Isabel Allende",
  },
];

// Quick action genres - MUST match the GENRES in Search.tsx
const QUICK_ACTIONS = [
  { label: "Ficción", genre: "Fiction" },
  { label: "Fantasía", genre: "Fantasy" },
  { label: "Romance", genre: "Romance" },
  { label: "Misterio", genre: "Mystery" },
  { label: "Ciencia Ficción", genre: "Science Fiction" },
  { label: "Biografía", genre: "Biography" },
  { label: "Historia", genre: "History" },
  { label: "Terror", genre: "Horror" },
];

const Feed = () => {
  const { user } = useAuth();
  const { data: userBooks } = useUserBooks();
  
  // Count books by status
  const readingCount = userBooks?.filter(b => b.status === "reading").length || 0;
  const toReadCount = userBooks?.filter(b => b.status === "to_read").length || 0;
  const readCount = userBooks?.filter(b => b.status === "read").length || 0;

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold gradient-autumn bg-clip-text text-transparent">
            Bookly
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* User's Reading Progress (if logged in and has books) */}
        {user && (readingCount > 0 || toReadCount > 0 || readCount > 0) && (
          <Card className="p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Library className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Tu biblioteca</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Link to="/perfil" className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <p className="text-2xl font-bold text-primary">{readingCount}</p>
                <p className="text-xs text-muted-foreground">Leyendo</p>
              </Link>
              <Link to="/perfil" className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <p className="text-2xl font-bold text-accent">{toReadCount}</p>
                <p className="text-xs text-muted-foreground">Por leer</p>
              </Link>
              <Link to="/perfil" className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <p className="text-2xl font-bold text-secondary">{readCount}</p>
                <p className="text-xs text-muted-foreground">Leídos</p>
              </Link>
            </div>
          </Card>
        )}

        {/* Welcome message for new/logged out users */}
        {(!user || (readingCount === 0 && toReadCount === 0 && readCount === 0)) && (
          <Card className="p-6 shadow-card bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="font-semibold text-foreground">
                {user ? "¡Empieza tu viaje lector!" : "Bienvenido a Bookly"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {user 
                ? "Explora millones de libros y crea tu biblioteca personal. Lleva el registro de todo lo que lees."
                : "Descubre tu próximo libro favorito. Busca, organiza y valora tus lecturas."
              }
            </p>
            <Link to="/buscar">
              <Button className="w-full gap-2">
                <Search className="w-4 h-4" />
                Explorar libros
              </Button>
            </Link>
          </Card>
        )}

        {/* Quick genre search */}
        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Explorar por género
          </h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.genre}
                to={`/buscar?genre=${encodeURIComponent(action.genre)}`}
              >
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-2 px-3"
                >
                  {action.label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Curated Collections */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            Descubre
          </h2>
          
          {CURATED_COLLECTIONS.map((collection) => (
            <Link key={collection.id} to={`/buscar${collection.searchParams}`}>
              <Card className="p-4 shadow-card hover:shadow-warm transition-shadow cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors`}>
                    <collection.icon className={`w-5 h-5 ${collection.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {collection.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {collection.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA to search */}
        <Card className="p-6 text-center shadow-card bg-muted/30">
          <Search className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold text-foreground mb-2">
            ¿Buscas algo específico?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Busca por título, autor, género o idioma
          </p>
          <Link to="/buscar">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              Ir a búsqueda avanzada
            </Button>
          </Link>
        </Card>

        {/* App info */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>
            Datos de libros proporcionados por Google Books y OpenLibrary
          </p>
        </div>
      </main>
    </div>
  );
};

export default Feed;