import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Library, Sparkles, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBooks } from "@/hooks/useUserBooks";
import { useAllCuratedCollections } from "@/hooks/useCuratedCollections";
import { CuratedCollectionSection } from "@/components/books/CuratedCollectionSection";
import { FeaturedReviews } from "@/components/reviews/FeaturedReviews";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { useTranslation } from "react-i18next";

const Feed = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: userBooks } = useUserBooks();
  const { data: curatedCollections, isLoading: isLoadingCollections } = useAllCuratedCollections();

  // Quick action genres
  const QUICK_ACTIONS = [
    { label: t("genres.fiction"), genre: "Fiction" },
    { label: t("genres.fantasy"), genre: "Fantasy" },
    { label: t("genres.romance"), genre: "Romance" },
    { label: t("genres.mystery"), genre: "Mystery" },
    { label: t("genres.scienceFiction"), genre: "Science Fiction" },
    { label: t("genres.biography"), genre: "Biography" },
    { label: t("genres.history"), genre: "History" },
    { label: t("genres.horror"), genre: "Horror" },
  ];
  
  const readingCount = userBooks?.filter(b => b.status === "reading").length || 0;
  const toReadCount = userBooks?.filter(b => b.status === "to_read").length || 0;
  const readCount = userBooks?.filter(b => b.status === "read").length || 0;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold gradient-autumn bg-clip-text text-transparent">
            {t("app.name")}
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {user && (readingCount > 0 || toReadCount > 0 || readCount > 0) && (
          <Card className="p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Library className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">{t("feed.yourLibrary")}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Link to="/perfil" className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <p className="text-2xl font-bold text-primary">{readingCount}</p>
                <p className="text-xs text-muted-foreground">{t("feed.reading")}</p>
              </Link>
              <Link to="/perfil" className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <p className="text-2xl font-bold text-accent">{toReadCount}</p>
                <p className="text-xs text-muted-foreground">{t("feed.toRead")}</p>
              </Link>
              <Link to="/perfil" className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <p className="text-2xl font-bold text-secondary">{readCount}</p>
                <p className="text-xs text-muted-foreground">{t("feed.readPlural")}</p>
              </Link>
            </div>
          </Card>
        )}

        {(!user || (readingCount === 0 && toReadCount === 0 && readCount === 0)) && (
          <Card className="p-6 shadow-card bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="font-semibold text-foreground">
                {user ? t("feed.startJourney") : t("feed.welcome")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {user ? t("feed.startDescription") : t("feed.welcomeDescription")}
            </p>
            <Link to="/buscar">
              <Button className="w-full gap-2">
                <Search className="w-4 h-4" />
                {t("feed.exploreBooks")}
              </Button>
            </Link>
          </Card>
        )}

        <div>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t("feed.exploreByGenre")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.genre} to={`/buscar?genre=${encodeURIComponent(action.genre)}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-2 px-3">
                  {action.label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {user && (
          <section>
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {t("feed.friendsActivity")}
            </h2>
            <ActivityFeed limit={10} />
          </section>
        )}

        <section>
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            {t("feed.featuredReviews")}
          </h2>
          <FeaturedReviews limit={3} />
        </section>

        {curatedCollections?.map((collection) => (
          <CuratedCollectionSection
            key={collection.id}
            title={collection.title}
            description={collection.description}
            books={collection.books}
            isLoading={isLoadingCollections}
            icon={collection.id === "classics" ? "star" : collection.id === "popular" ? "trending" : "award"}
          />
        ))}

        {isLoadingCollections && !curatedCollections && (
          <>
            <CuratedCollectionSection title={t("collections.modernClassics")} description={t("collections.modernClassicsDesc")} books={[]} isLoading={true} icon="star" />
            <CuratedCollectionSection title={t("collections.mostRead")} description={t("collections.mostReadDesc")} books={[]} isLoading={true} icon="trending" />
            <CuratedCollectionSection title={t("collections.literaryAwards")} description={t("collections.literaryAwardsDesc")} books={[]} isLoading={true} icon="award" />
          </>
        )}

        <Card className="p-6 text-center shadow-card bg-muted/30">
          <Search className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold text-foreground mb-2">{t("feed.searchSpecific")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("feed.searchDescription")}</p>
          <Link to="/buscar">
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              {t("feed.advancedSearch")}
            </Button>
          </Link>
        </Card>

        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>{t("app.dataCredits")}</p>
        </div>
      </main>
    </div>
  );
};

export default Feed;
