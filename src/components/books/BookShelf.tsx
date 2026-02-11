import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Loader2 } from "lucide-react";
import { BookCard } from "./BookCard";
import { useUserBooks, type ReadingStatus } from "@/hooks/useUserBooks";
import { useTranslation } from "react-i18next";

interface BookShelfProps {
  userId?: string;
  showTabs?: boolean;
}

export const BookShelf = ({ showTabs = true }: BookShelfProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReadingStatus | "all">("all");
  const { data: userBooks, isLoading, error } = useUserBooks();

  const statusTabs: { value: ReadingStatus | "all"; label: string }[] = [
    { value: "all", label: t("bookshelf.all") },
    { value: "reading", label: t("bookshelf.reading") },
    { value: "to_read", label: t("bookshelf.toRead") },
    { value: "read", label: t("bookshelf.read") },
  ];

  const filteredBooks = userBooks?.filter((ub) => {
    if (activeTab === "all") return true;
    return ub.status === activeTab;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive">{t("bookshelf.errorLoading")}</p>
      </Card>
    );
  }

  const statusLabelMap: Record<string, string> = {
    reading: t("bookshelf.statusReading"),
    to_read: t("bookshelf.statusToRead"),
    read: t("bookshelf.statusRead"),
  };

  const EmptyState = () => (
    <Card className="p-8 text-center shadow-card">
      <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
      <h3 className="font-semibold text-foreground mb-2">
        {activeTab === "all"
          ? t("bookshelf.emptyLibrary")
          : t("bookshelf.noBooks", { status: statusLabelMap[activeTab] || "" })}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{t("bookshelf.searchAndAdd")}</p>
      <Button asChild variant="outline">
        <a href="/buscar">{t("bookshelf.exploreBooks")}</a>
      </Button>
    </Card>
  );

  const renderBook = (userBook: any) =>
    userBook.book && (
      <BookCard
        key={userBook.id}
        book={{
          id: userBook.book.id, title: userBook.book.title, authors: userBook.book.authors,
          cover_url: userBook.book.cover_url, description: null, isbn10: null, isbn13: null,
          genres: [], language: "es", page_count: userBook.book.page_count, published_year: null,
          average_rating: 0, ratings_count: 0, source: "manual", created_at: "", updated_at: "",
        }}
        userStatus={userBook.status} userRating={userBook.rating} userBookId={userBook.id}
        customCoverUrl={userBook.custom_cover_url} compact
      />
    );

  if (showTabs) {
    return (
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="w-full mb-4">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
              {tab.label}
              {userBooks && (
                <span className="ml-1 text-xs opacity-60">
                  ({tab.value === "all" ? userBooks.length : userBooks.filter(ub => ub.status === tab.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-3">
            {filteredBooks && filteredBooks.length > 0 ? filteredBooks.map(renderBook) : <EmptyState />}
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  return (
    <div className="space-y-3">
      {filteredBooks && filteredBooks.length > 0 ? filteredBooks.map(renderBook) : <EmptyState />}
    </div>
  );
};
