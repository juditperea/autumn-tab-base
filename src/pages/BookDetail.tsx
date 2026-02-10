import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Star, Calendar, BookOpen, Globe, Loader2, MessageSquare, ExternalLink } from "lucide-react";
import { useBook } from "@/hooks/useBooks";
import { useUserBookForBook, useAddToShelf, useUpdateUserBook, useRemoveFromShelf } from "@/hooks/useUserBooks";
import { useAuth } from "@/contexts/AuthContext";
import { StatusSelector } from "@/components/books/StatusSelector";
import { RatingControl } from "@/components/books/RatingControl";
import { CoverUpload } from "@/components/books/CoverUpload";
import { ReviewList } from "@/components/reviews/ReviewList";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { ReadingStatus } from "@/hooks/useUserBooks";

const ExternalReviewsSection = ({ book }: { book: { title: string; authors: string[]; isbn13?: string | null } }) => {
  const { t } = useTranslation();
  const googleBooksUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${book.title}" ${book.authors[0]} reseña review`)}`;
  const goodreadsUrl = book.isbn13 ? `https://www.goodreads.com/search?q=${book.isbn13}` : `https://www.goodreads.com/search?q=${encodeURIComponent(`${book.title} ${book.authors[0]}`)}`;

  return (
    <Card className="p-6 shadow-card">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <ExternalLink className="w-5 h-5" />
          <span className="text-sm">{t("book.searchExternal")}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" size="sm" asChild><a href={goodreadsUrl} target="_blank" rel="noopener noreferrer">Goodreads<ExternalLink className="w-3 h-3 ml-1" /></a></Button>
          <Button variant="outline" size="sm" asChild><a href={googleBooksUrl} target="_blank" rel="noopener noreferrer">Google<ExternalLink className="w-3 h-3 ml-1" /></a></Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("book.externalNote")}</p>
      </div>
    </Card>
  );
};

const BookDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: book, isLoading: bookLoading, error: bookError } = useBook(id);
  const { data: userBook, isLoading: userBookLoading } = useUserBookForBook(id);
  const addToShelf = useAddToShelf();
  const updateUserBook = useUpdateUserBook();
  const removeFromShelf = useRemoveFromShelf();
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const handleCoverUploaded = async (url: string | null) => {
    if (!userBook) return;
    try { await updateUserBook.mutateAsync({ id: userBook.id, custom_cover_url: url }); } catch (error) { console.error("Error updating cover:", error); }
  };

  const handleStatusChange = async (status: ReadingStatus) => {
    try {
      if (userBook) { await updateUserBook.mutateAsync({ id: userBook.id, status }); }
      else { await addToShelf.mutateAsync({ bookId: id!, status }); }
      toast({ title: t("book.saved"), description: t("book.addedToLibrary") });
    } catch (error) {
      toast({ variant: "destructive", title: t("common.error"), description: t("book.saveError") });
    }
  };

  const handleRatingChange = async (rating: number | null) => {
    if (!userBook) return;
    try {
      await updateUserBook.mutateAsync({ id: userBook.id, rating });
      setShowRatingDialog(false);
      toast({ title: rating ? t("book.ratingSaved") : t("book.ratingRemoved") });
    } catch (error) {
      toast({ variant: "destructive", title: t("common.error"), description: t("book.ratingError") });
    }
  };

  const handleRemove = async () => {
    if (!userBook) return;
    try {
      await removeFromShelf.mutateAsync(userBook.id);
      toast({ title: t("book.removed"), description: t("book.removedDescription") });
    } catch (error) {
      toast({ variant: "destructive", title: t("common.error"), description: t("book.removeError") });
    }
  };

  if (bookLoading || userBookLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (bookError || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">{t("book.notFound")}</h2>
          <p className="text-muted-foreground mb-4">{t("book.notFoundDescription")}</p>
          <Button onClick={() => navigate(-1)}>{t("book.back")}</Button>
        </Card>
      </div>
    );
  }

  const isPending = addToShelf.isPending || updateUserBook.isPending || removeFromShelf.isPending;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-lg font-semibold text-foreground truncate flex-1 mx-4">{book.title}</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 shadow-card">
          <div className="flex gap-4">
            {user && userBook ? (
              <CoverUpload userId={user.id} bookId={book.id} currentCoverUrl={book.cover_url} customCoverUrl={userBook.custom_cover_url} onCoverUploaded={handleCoverUploaded} />
            ) : book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-28 h-40 rounded-lg object-cover flex-shrink-0 shadow-warm" />
            ) : (
              <div className="w-28 h-40 rounded-lg gradient-autumn flex-shrink-0 shadow-warm" />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1 line-clamp-2">{book.title}</h2>
              <p className="text-muted-foreground mb-3">{book.authors.join(", ")}</p>
              {book.average_rating > 0 ? (
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="text-lg font-bold text-foreground">{book.average_rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({t("book.ratings", { count: book.ratings_count })})</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">{t("book.noRatings")}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {book.genres.slice(0, 3).map((genre) => <Badge key={genre} variant="secondary" className="text-xs">{genre}</Badge>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
            {book.published_year && <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{book.published_year}</div>}
            {book.page_count && <div className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{book.page_count} {t("book.pages")}</div>}
            {book.language && <div className="flex items-center gap-1"><Globe className="w-4 h-4" />{book.language.toUpperCase()}</div>}
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <StatusSelector value={userBook?.status ?? null} onChange={handleStatusChange} onRemove={userBook ? handleRemove : undefined} loading={isPending} variant="buttons" />
          {userBook && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("book.yourRating")}</p>
                  {userBook.rating ? <p className="text-2xl font-bold text-primary">{userBook.rating}/10</p> : <p className="text-sm text-muted-foreground">{t("book.unrated")}</p>}
                </div>
                <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                  <DialogTrigger asChild><Button variant="outline">{userBook.rating ? t("book.change") : t("book.rate")}</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{t("book.rateTitle", { title: book.title })}</DialogTitle></DialogHeader>
                    <RatingControl value={userBook.rating} onChange={handleRatingChange} size="lg" />
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}
        </Card>

        {book.description && (
          <Card className="p-4 shadow-card">
            <h3 className="font-semibold text-foreground mb-2">{t("book.synopsis")}</h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{book.description}</p>
          </Card>
        )}

        <div className="space-y-4">
          <Tabs defaultValue="app" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="app" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />{t("book.communityReviews")}</TabsTrigger>
              <TabsTrigger value="external" className="flex items-center gap-2"><ExternalLink className="w-4 h-4" />{t("book.externalReviews")}</TabsTrigger>
            </TabsList>
            <TabsContent value="app" className="mt-4"><ReviewList bookId={book.id} /></TabsContent>
            <TabsContent value="external" className="mt-4"><ExternalReviewsSection book={book} /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default BookDetail;
