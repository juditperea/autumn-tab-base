import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ExternalBook } from "@/hooks/useExternalBooks";
import { ExternalBookCard } from "./ExternalBookCard";
import { Star, TrendingUp, Award, LucideIcon } from "lucide-react";

interface CuratedCollectionSectionProps {
  title: string;
  description: string;
  books: ExternalBook[];
  isLoading: boolean;
  icon?: "star" | "trending" | "award";
}

const iconMap: Record<string, LucideIcon> = {
  star: Star,
  trending: TrendingUp,
  award: Award,
};

const colorMap: Record<string, string> = {
  star: "text-accent",
  trending: "text-primary",
  award: "text-secondary",
};

export const CuratedCollectionSection = ({
  title,
  description,
  books,
  isLoading,
  icon = "star",
}: CuratedCollectionSectionProps) => {
  const IconComponent = iconMap[icon] || Star;
  const iconColor = colorMap[icon] || "text-primary";

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <IconComponent className={`w-5 h-5 ${iconColor}`} />
          <div>
            <h2 className="font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex-shrink-0 w-[280px] p-3">
              <div className="flex gap-3">
                <Skeleton className="w-16 h-24 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <IconComponent className={`w-5 h-5 ${iconColor}`} />
        <div>
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {books.map((book, index) => (
            <div key={`${book.isbn13 || book.isbn10 || book.title}-${index}`} className="flex-shrink-0 w-[300px]">
              <ExternalBookCard book={book} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
