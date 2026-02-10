import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, Loader2, X, Filter, BookOpen, User, Calendar, Tag, Globe } from "lucide-react";
import { useExternalBookSearch, SearchFilters } from "@/hooks/useExternalBooks";
import { ExternalBookCard } from "@/components/books/ExternalBookCard";
import { useDebounce } from "@/hooks/useDebounce";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTranslation } from "react-i18next";

const Search = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get("genre") || "";
  const initialAuthor = searchParams.get("author") || "";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState(initialAuthor);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [yearRange, setYearRange] = useState("all");
  const [language, setLanguage] = useState("all");
  const [showFilters, setShowFilters] = useState(!!initialAuthor || !!initialGenre);
  
  const debouncedQuery = useDebounce(searchQuery, 400);
  const debouncedAuthor = useDebounce(authorFilter, 400);
  
  const { results, isSearching, search, clearResults, meta } = useExternalBookSearch();

  const GENRES = [
    { label: t("genres.fiction"), value: "Fiction" },
    { label: t("genres.fantasy"), value: "Fantasy" },
    { label: t("genres.romance"), value: "Romance" },
    { label: t("genres.mystery"), value: "Mystery" },
    { label: t("genres.scienceFiction"), value: "Science Fiction" },
    { label: t("genres.thriller"), value: "Thriller" },
    { label: t("genres.biography"), value: "Biography" },
    { label: t("genres.history"), value: "History" },
    { label: t("genres.selfHelp"), value: "Self-Help" },
    { label: t("genres.children"), value: "Children" },
    { label: t("genres.youngAdult"), value: "Young Adult" },
    { label: t("genres.horror"), value: "Horror" },
    { label: t("genres.poetry"), value: "Poetry" },
    { label: t("genres.philosophy"), value: "Philosophy" },
    { label: t("genres.art"), value: "Art" },
    { label: t("genres.cooking"), value: "Cooking" },
    { label: t("genres.travel"), value: "Travel" },
  ];

  const YEAR_RANGES = [
    { label: t("search.anyYear"), value: "all", min: undefined, max: undefined },
    { label: `2020 - ${t("search.present")}`, value: "2020-2030", min: 2020, max: 2030 },
    { label: "2010 - 2019", value: "2010-2019", min: 2010, max: 2019 },
    { label: "2000 - 2009", value: "2000-2009", min: 2000, max: 2009 },
    { label: "1990 - 1999", value: "1990-1999", min: 1990, max: 1999 },
    { label: "1980 - 1989", value: "1980-1989", min: 1980, max: 1989 },
    { label: `${t("search.before")} 1980`, value: "0-1979", min: 0, max: 1979 },
  ];

  const LANGUAGES = [
    { label: t("search.allLanguages"), value: "all" },
    { label: t("search.spanish"), value: "es" },
    { label: t("search.english"), value: "en" },
    { label: t("search.french"), value: "fr" },
    { label: t("search.german"), value: "de" },
    { label: t("search.portuguese"), value: "pt" },
    { label: t("search.italian"), value: "it" },
    { label: t("search.catalan"), value: "ca" },
  ];

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

  const hasSearchCriteria = debouncedQuery.trim() || debouncedAuthor.trim() || selectedGenre || yearRange !== "all" || language !== "all";

  useEffect(() => {
    if (hasSearchCriteria) {
      search(debouncedQuery || "", getFilters());
    } else {
      clearResults();
    }
  }, [debouncedQuery, debouncedAuthor, selectedGenre, yearRange, language]);

  const clearAllFilters = () => {
    setAuthorFilter("");
    setSelectedGenre("");
    setYearRange("all");
    setLanguage("all");
  };

  const hasActiveFilters = authorFilter || selectedGenre || yearRange !== "all" || language !== "all";
  const activeFiltersCount = [authorFilter, selectedGenre, yearRange !== "all" ? yearRange : "", language !== "all" ? language : ""].filter(Boolean).length;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">{t("search.title")}</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder={t("search.placeholder")} className="pl-10 pr-12 h-12 rounded-xl shadow-card" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {t("search.advancedFilters")}
                {activeFiltersCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFiltersCount}</Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <X className="w-4 h-4" />
                {t("search.clear")}
              </button>
            )}
          </div>

          <CollapsibleContent className="mt-4 space-y-4">
            <Card className="p-4 space-y-4 shadow-card">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4 text-primary" />{t("search.author")}</label>
                <Input placeholder={t("search.authorPlaceholder")} value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Tag className="w-4 h-4 text-primary" />{t("search.genre")}</label>
                <Select value={selectedGenre || "all"} onValueChange={(v) => setSelectedGenre(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder={t("search.allGenres")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("search.allGenres")}</SelectItem>
                    {GENRES.map((genre) => <SelectItem key={genre.value} value={genre.value}>{genre.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />{t("search.publicationYear")}</label>
                <Select value={yearRange} onValueChange={setYearRange}>
                  <SelectTrigger className="h-10"><SelectValue placeholder={t("search.anyYear")} /></SelectTrigger>
                  <SelectContent>
                    {YEAR_RANGES.map((range) => <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />{t("search.language")}</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-10"><SelectValue placeholder={t("search.allLanguages")} /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">{t("search.relevanceNote")}</p>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("search.searchingMultiple")}</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("search.resultsInfo", { count: results.length })}
              </p>
              {meta && <p className="text-xs text-muted-foreground">Google: {meta.sources.google_books} | OL: {meta.sources.open_library}</p>}
            </div>
            <div className="space-y-3">
              {results.map((book, index) => <ExternalBookCard key={`${book.isbn13 || book.isbn10 || book.title}-${index}`} book={book} />)}
            </div>
          </div>
        ) : hasSearchCriteria ? (
          <Card className="p-8 text-center shadow-card">
            <SearchIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">{t("search.noResults")}</h3>
            <p className="text-sm text-muted-foreground">{t("search.tryOther")}</p>
          </Card>
        ) : (
          <Card className="p-8 text-center shadow-card">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">{t("search.discoverNext")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("search.searchMillions")}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="text-xs">{t("search.unifiedResults")}</Badge>
              <Badge variant="secondary" className="text-xs">{t("search.noDuplicates")}</Badge>
              <Badge variant="secondary" className="text-xs">{t("search.sortedRelevance")}</Badge>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Search;
