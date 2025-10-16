import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, TrendingUp, Sparkles } from "lucide-react";

const Search = () => {
  const trendingBooks = [
    { title: "El nombre del viento", author: "Patrick Rothfuss", genre: "Fantasía" },
    { title: "Cien años de soledad", author: "Gabriel García Márquez", genre: "Realismo mágico" },
    { title: "1984", author: "George Orwell", genre: "Distopía" },
  ];

  const genres = ["Fantasía", "Ciencia ficción", "Romance", "Thriller", "No ficción"];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Buscar</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Search Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar libros, autores..."
            className="pl-10 h-12 rounded-xl shadow-card"
          />
        </div>

        {/* Trending Books */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Tendencias</h2>
          </div>
          <div className="space-y-3">
            {trendingBooks.map((book, index) => (
              <Card key={index} className="p-4 shadow-card hover:shadow-warm tab-transition cursor-pointer">
                <div className="flex gap-3">
                  <div className="w-12 h-16 rounded-lg bg-gradient-autumn" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                      {book.genre}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Genres */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Explorar géneros</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                className="px-4 py-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-foreground tab-transition"
              >
                {genre}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Search;
