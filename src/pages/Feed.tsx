import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { BookOpen, Heart, MessageCircle } from "lucide-react";

const Feed = () => {
  const mockPosts = [
    {
      id: 1,
      user: "María",
      book: "El nombre del viento",
      rating: 4.5,
      comment: "¡Una obra maestra! La prosa de Rothfuss es simplemente mágica.",
      likes: 24,
      comments: 5,
    },
    {
      id: 2,
      user: "Juan",
      book: "1984",
      rating: 5,
      comment: "Más relevante que nunca. Una lectura obligatoria.",
      likes: 18,
      comments: 3,
    },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold gradient-autumn bg-clip-text text-transparent">
            Bookly
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Feed Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {mockPosts.map((post) => (
          <Card key={post.id} className="p-4 shadow-card hover:shadow-warm tab-transition">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-autumn" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{post.user}</h3>
                <p className="text-sm text-muted-foreground">
                  leyó <span className="text-primary font-medium">{post.book}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-lg ${
                    i < Math.floor(post.rating)
                      ? "text-accent"
                      : "text-muted-foreground/30"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            <p className="text-foreground mb-4">{post.comment}</p>

            <div className="flex items-center gap-4 text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-primary tab-transition">
                <Heart className="w-5 h-5" />
                <span className="text-sm">{post.likes}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-primary tab-transition">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.comments}</span>
              </button>
            </div>
          </Card>
        ))}

        {/* Empty State Placeholder */}
        <Card className="p-8 text-center shadow-card">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold text-foreground mb-2">
            Descubre más lectores
          </h3>
          <p className="text-sm text-muted-foreground">
            Sigue a tus amigos para ver sus reseñas aquí
          </p>
        </Card>
      </main>
    </div>
  );
};

export default Feed;
