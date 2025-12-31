import { useState, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, TrendingUp, Sparkles, Loader2, X } from "lucide-react";
import { useBooks, useSearchBooks } from "@/hooks/useBooks";
import { useUserBooks } from "@/hooks/useUserBooks";
import { BookCard } from "@/components/books/BookCard";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  const { data: allBooks, isLoading: booksLoading } = useBooks();
  const { data: searchResults, isLoading: searchLoading } = useSearchBooks(searchQuery);
  const { data: userBooks } = useUserBooks();

  // Get unique genres from all books
  const genres = useMemo(() => {
    if (!allBooks) return [];
    const allGenres = allBooks.flatMap(book => book.genres);
    return [...new Set(allGenres)].slice(0, 12);
  }, [allBooks]);

  // Filter books based on search and genres (multiple)
  const displayBooks = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults ?? [];
    }
    
    if (selectedGenres.length > 0 && allBooks) {
      return allBooks.filter(book => 
        selectedGenres.every(genre => book.genres.includes(genre))
      );
    }
    
    return allBooks ?? [];
  }, [searchQuery, searchResults, selectedGenres, allBooks]);

  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
    setSearchQuery("");
  };

  const clearGenres = () => {
    setSelectedGenres([]);
  };

  // Get user book data for each book
  const getUserBookData = (bookId: string) => {
    const userBook = userBooks?.find(ub => ub.book_id === bookId);
    return {
      status: userBook?.status ?? null,
      rating: userBook?.rating ?? null,
    };
  };

  const isLoading = booksLoading || (searchQuery && searchLoading);

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
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setSelectedGenres([]);
              }
            }}
          />
        </div>

        {/* Genres */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Explorar géneros</h2>
            </div>
            {selectedGenres.length > 0 && (
              <button
                onClick={clearGenres}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar ({selectedGenres.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 rounded-full tab-transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-primary/20 text-foreground"
                  }`}
                >
                  {genre}
                  {isSelected && (
                    <X className="w-3 h-3 ml-1 inline-block" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Books List */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {searchQuery 
                ? `Resultados para "${searchQuery}"` 
                : selectedGenres.length > 0 
                  ? `Libros de ${selectedGenres.join(" + ")}`
                  : "Todos los libros"}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : displayBooks.length > 0 ? (
            <div className="space-y-3">
              {displayBooks.map((book) => {
                const userData = getUserBookData(book.id);
                return (
                  <BookCard
                    key={book.id}
                    book={book}
                    userStatus={userData.status}
                    userRating={userData.rating}
                  />
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center shadow-card">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold text-foreground mb-2">
                No se encontraron libros
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? "Intenta con otros términos de búsqueda"
                  : selectedGenres.length > 0
                    ? "No hay libros que coincidan con todos los géneros seleccionados"
                    : "No hay libros disponibles en este momento"}
              </p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};

export default Search;
