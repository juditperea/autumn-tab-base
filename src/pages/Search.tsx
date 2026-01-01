import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search as SearchIcon, 
  Loader2, 
  X, 
  Filter, 
  BookOpen,
  User,
  Calendar,
  Tag
} from "lucide-react";
import { useExternalBookSearch } from "@/hooks/useExternalBooks";
import { ExternalBookCard } from "@/components/books/ExternalBookCard";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Common genres for filtering
const GENRES = [
  "Fiction",
  "Fantasy",
  "Romance",
  "Mystery",
  "Science Fiction",
  "Thriller",
  "Biography",
  "History",
  "Self-Help",
  "Children",
  "Young Adult",
  "Horror",
];

// Year ranges
const YEAR_RANGES = [
  { label: "Cualquier año", value: "" },
  { label: "2020 - Presente", value: "2020-2030" },
  { label: "2010 - 2019", value: "2010-2019" },
  { label: "2000 - 2009", value: "2000-2009" },
  { label: "1990 - 1999", value: "1990-1999" },
  { label: "Antes de 1990", value: "0-1989" },
];

// Languages
const LANGUAGES = [
  { label: "Todos los idiomas", value: "" },
  { label: "Español", value: "es" },
  { label: "Inglés", value: "en" },
  { label: "Francés", value: "fr" },
  { label: "Alemán", value: "de" },
  { label: "Portugués", value: "pt" },
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [yearRange, setYearRange] = useState("");
  const [language, setLanguage] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 500);
  
  const { 
    results, 
    isSearching, 
    search,
    clearResults 
  } = useExternalBookSearch();

  // Trigger search when query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      // Build search query with filters
      let fullQuery = debouncedQuery;
      
      if (authorFilter.trim()) {
        fullQuery += ` inauthor:${authorFilter}`;
      }
      
      if (selectedGenre) {
        fullQuery += ` subject:${selectedGenre}`;
      }
      
      search(fullQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery, authorFilter, selectedGenre]);

  // Filter results by year and language (client-side)
  const filteredResults = results.filter(book => {
    // Filter by year
    if (yearRange) {
      const [minYear, maxYear] = yearRange.split("-").map(Number);
      if (!book.published_year || book.published_year < minYear || book.published_year > maxYear) {
        return false;
      }
    }
    
    // Filter by language
    if (language && book.language !== language) {
      return false;
    }
    
    return true;
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearAllFilters = () => {
    setAuthorFilter("");
    setSelectedGenre("");
    setYearRange("");
    setLanguage("");
  };

  const hasActiveFilters = authorFilter || selectedGenre || yearRange || language;

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Buscar Libros</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Search Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            className="pl-10 pr-12 h-12 rounded-xl shadow-card"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters Toggle */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    Activos
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          <CollapsibleContent className="mt-4 space-y-4">
            <Card className="p-4 space-y-4 shadow-card">
              {/* Author Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Autor
                </label>
                <Input
                  placeholder="Filtrar por autor..."
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                />
              </div>

              {/* Genre Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Género
                </label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los géneros</SelectItem>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Año de publicación
                </label>
                <Select value={yearRange} onValueChange={setYearRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier año" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Idioma
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los idiomas" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Results */}
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Buscando en Google Books y OpenLibrary...
            </p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredResults.length} resultado{filteredResults.length !== 1 ? "s" : ""} encontrado{filteredResults.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-3">
              {filteredResults.map((book, index) => (
                <ExternalBookCard key={`${book.isbn13 || book.title}-${index}`} book={book} />
              ))}
            </div>
          </div>
        ) : debouncedQuery.trim() ? (
          <Card className="p-8 text-center shadow-card">
            <SearchIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-sm text-muted-foreground">
              Intenta con otros términos o ajusta los filtros
            </p>
          </Card>
        ) : (
          <Card className="p-8 text-center shadow-card">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">
              Descubre tu próximo libro
            </h3>
            <p className="text-sm text-muted-foreground">
              Busca por título, autor o género en millones de libros de Google Books y OpenLibrary
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Search;
