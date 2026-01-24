import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Loader2 } from "lucide-react";
import { BookCard } from "./BookCard";
import { useUserBooks, type ReadingStatus } from "@/hooks/useUserBooks";

interface BookShelfProps {
  userId?: string;
  showTabs?: boolean;
}

const statusTabs: { value: ReadingStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "reading", label: "Leyendo" },
  { value: "to_read", label: "Por leer" },
  { value: "read", label: "Leídos" },
];

export const BookShelf = ({ showTabs = true }: BookShelfProps) => {
  const [activeTab, setActiveTab] = useState<ReadingStatus | "all">("all");
  const { data: userBooks, isLoading, error } = useUserBooks();

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
        <p className="text-destructive">Error al cargar tu biblioteca</p>
      </Card>
    );
  }

  const EmptyState = () => (
    <Card className="p-8 text-center shadow-card">
      <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
      <h3 className="font-semibold text-foreground mb-2">
        {activeTab === "all" 
          ? "Tu biblioteca está vacía" 
          : `No tienes libros ${activeTab === "reading" ? "leyendo" : activeTab === "to_read" ? "por leer" : "leídos"}`}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Busca libros y añádelos a tu biblioteca
      </p>
      <Button asChild variant="outline">
        <a href="/buscar">Explorar libros</a>
      </Button>
    </Card>
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
                  ({tab.value === "all" 
                    ? userBooks.length 
                    : userBooks.filter(ub => ub.status === tab.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-3">
            {filteredBooks && filteredBooks.length > 0 ? (
              filteredBooks.map((userBook) => (
                userBook.book && (
                  <BookCard
                    key={userBook.id}
                    book={{
                      id: userBook.book.id,
                      title: userBook.book.title,
                      authors: userBook.book.authors,
                      cover_url: userBook.book.cover_url,
                      description: null,
                      isbn10: null,
                      isbn13: null,
                      genres: [],
                      language: "es",
                      page_count: userBook.book.page_count,
                      published_year: null,
                      average_rating: 0,
                      ratings_count: 0,
                      source: "manual",
                      created_at: "",
                      updated_at: "",
                    }}
                    userStatus={userBook.status}
                    userRating={userBook.rating}
                    userBookId={userBook.id}
                    customCoverUrl={userBook.custom_cover_url}
                    compact
                  />
                )
              ))
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  return (
    <div className="space-y-3">
      {filteredBooks && filteredBooks.length > 0 ? (
        filteredBooks.map((userBook) => (
          userBook.book && (
            <BookCard
              key={userBook.id}
              book={{
                id: userBook.book.id,
                title: userBook.book.title,
                authors: userBook.book.authors,
                cover_url: userBook.book.cover_url,
                description: null,
                isbn10: null,
                isbn13: null,
                genres: [],
                language: "es",
                page_count: userBook.book.page_count,
                published_year: null,
                average_rating: 0,
                ratings_count: 0,
                source: "manual",
                created_at: "",
                updated_at: "",
              }}
              userStatus={userBook.status}
              userRating={userBook.rating}
              userBookId={userBook.id}
              customCoverUrl={userBook.custom_cover_url}
              compact
            />
          )
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  );
};
