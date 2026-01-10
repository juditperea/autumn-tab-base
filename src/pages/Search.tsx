import { useState, useEffect, useCallback } from "react";
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
  Tag,
  Globe
} from "lucide-react";
import { useExternalBookSearch, SearchFilters } from "@/hooks/useExternalBooks";
import { ExternalBookCard } from "@/components/books/ExternalBookCard";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Common genres for filtering (Spanish labels, English values for API)
const GENRES = [
  { label: "Ficción", value: "Fiction" },
  { label: "Fantasía", value: "Fantasy" },
  { label: "Romance", value: "Romance" },
  { label: "Misterio", value: "Mystery" },
  { label: "Ciencia Ficción", value: "Science Fiction" },
  { label: "Thriller", value: "Thriller" },
  { label: "Biografía", value: "Biography" },
  { label: "Historia", value: "History" },
  { label: "Autoayuda", value: "Self-Help" },
  { label: "Infantil", value: "Children" },
  { label: "Juvenil", value: "Young Adult" },
  { label: "Terror", value: "Horror" },
  { label: "Poesía", value: "Poetry" },
  { label: "Filosofía", value: "Philosophy" },
  { label: "Arte", value: "Art" },
  { label: "Cocina", value: "Cooking" },
  { label: "Viajes", value: "Travel" },
];

// Year ranges
const YEAR_RANGES = [
  { label: "Cualquier año", value: "all", min: undefined, max: undefined },
  { label: "2020 - Presente", value: "2020-2030", min: 2020, max: 2030 },
  { label: "2010 - 2019", value: "2010-2019", min: 2010, max: 2019 },
  { label: "2000 - 2009", value: "2000-2009", min: 2000, max: 2009 },
  { label: "1990 - 1999", value: "1990-1999", min: 1990, max: 1999 },
  { label: "1980 - 1989", value: "1980-1989", min: 1980, max: 1989 },
  { label: "Antes de 1980", value: "0-1979", min: 0, max: 1979 },
];

// Languages
const LANGUAGES = [
  { label: "Todos los idiomas", value: "all" },
  { label: "Español", value: "es" },
  { label: "Inglés", value: "en" },
  { label: "Francés", value: "fr" },
  { label: "Alemán", value: "de" },
  { label: "Portugués", value: "pt" },
  { label: "Italiano", value: "it" },
  { label: "Catalán", value: "ca" },
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [yearRange, setYearRange] = useState("all");
  const [language, setLanguage] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const debouncedQuery = useDebounce(searchQuery, 400);
  const debouncedAuthor = useDebounce(authorFilter, 400);
  
  const { 
    results, 
    isSearching, 
    search,
    clearResults,
    meta,
  } = useExternalBookSearch();

  // Build filters object
  const getFilters = useCallback((): SearchFilters => {
    const yearConfig = YEAR_RANGES.find(y => y.value === yearRange);
    
    return {
      author: debouncedAuthor.trim() || undefined,
      genre: selectedGenre || undefined,
      yearMin: yearConfig?.min,
      yearMax: yearConfig?.max,
      language: language !== "all" ? language : undefined,
    };
  }, [debouncedAuthor, selectedGenre, yearRange, language]);

  // Check if any filter is active
  const hasSearchCriteria = debouncedQuery.trim() || debouncedAuthor.trim() || selectedGenre || language !== "all";

  // Trigger search when query or filters change
  useEffect(() => {
    if (hasSearchCriteria) {
      search(debouncedQuery || "", getFilters());
    } else {
      clearResults();
    }
  }, [debouncedQuery, debouncedAuthor, selectedGenre, yearRange, language]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const clearAllFilters = () => {
    setAuthorFilter("");
    setSelectedGenre("");
    setYearRange("all");
    setLanguage("all");
  };

  const hasActiveFilters = authorFilter || selectedGenre || yearRange !== "all" || language !== "all";

  const activeFiltersCount = [
    authorFilter,
    selectedGenre,
    yearRange !== "all" ? yearRange : "",
    language !== "all" ? language : "",
  ].filter(Boolean).length;

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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                Filtros avanzados
                {activeFiltersCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar
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
                  placeholder="Ej: Gabriel García Márquez"
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Genre Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Género
                </label>
                <Select value={selectedGenre || "all"} onValueChange={(v) => setSelectedGenre(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Todos los géneros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los géneros</SelectItem>
                    {GENRES.map((genre) => (
                      <SelectItem key={genre.value} value={genre.value}>
                        {genre.label}
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
                  <SelectTrigger className="h-10">
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
                  <Globe className="w-4 h-4 text-primary" />
                  Idioma
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-10">
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

              <p className="text-xs text-muted-foreground">
                Los resultados se ordenan por relevancia, priorizando tu idioma y calidad de datos.
              </p>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Results */}
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Buscando en múltiples fuentes...
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.length} resultado{results.length !== 1 ? "s" : ""} ordenado{results.length !== 1 ? "s" : ""} por relevancia
              </p>
              {meta && (
                <p className="text-xs text-muted-foreground">
                  Google: {meta.sources.google_books} | OL: {meta.sources.open_library}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {results.map((book, index) => (
                <ExternalBookCard key={`${book.isbn13 || book.isbn10 || book.title}-${index}`} book={book} />
              ))}
            </div>
          </div>
        ) : hasSearchCriteria ? (
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
            <p className="text-sm text-muted-foreground mb-4">
              Busca en millones de libros de Google Books y OpenLibrary
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="text-xs">
                Resultados unificados
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Sin duplicados
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Ordenados por relevancia
              </Badge>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Search;
