import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, BookOpen, Award, LogOut, Clock, MessageSquare, Pencil, Upload, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookShelf } from "@/components/books/BookShelf";
import { useUserBooksStats } from "@/hooks/useUserBooks";
import { useUserReviews } from "@/hooks/useReviews";
import { RecentActivity } from "@/components/profile/RecentActivity";
import { UserReviewsList } from "@/components/profile/UserReviewsList";
import { FollowStats } from "@/components/social/FollowStats";
import { FollowersModal } from "@/components/social/FollowersModal";
import { FavoriteBooks } from "@/components/profile/FavoriteBooks";
import { ReadingGoalCard } from "@/components/profile/ReadingGoalCard";
import { ReadingStatsSection } from "@/components/stats/ReadingStatsSection";
import { getThemeGradient, getThemeRing } from "@/components/profile/ThemeColorPicker";

interface Profile {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_color: string | null;
  reading_goal: number | null;
  reading_goal_year: number | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");

  const bookStats = useUserBooksStats();
  const { data: userReviews } = useUserReviews(user?.id);

  const themeColor = profile?.theme_color || "orange";

  const stats = [{
    label: "Libros leídos",
    value: bookStats.read,
    icon: BookOpen
  }, {
    label: "Reseñas",
    value: userReviews?.length ?? 0,
    icon: Award
  }];

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Mi espacio lector</h1>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="rounded-full" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <Card className="p-6 text-center shadow-card relative overflow-hidden">
          {/* Decorative gradient bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getThemeGradient(themeColor)}`} />
          
          {/* Edit button */}
          <Link 
            to="/editar-perfil"
            className="absolute top-3 right-3"
          >
            <Button size="icon" variant="ghost" className="rounded-full h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>

          {/* Avatar */}
          <div className="relative inline-block group">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username}
                className={`w-24 h-24 mx-auto mb-4 rounded-full object-cover ring-4 ${getThemeRing(themeColor)}`}
              />
            ) : (
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${getThemeGradient(themeColor)} flex items-center justify-center ring-4 ${getThemeRing(themeColor)}`}>
                <span className="text-3xl font-bold text-white">
                  {profile?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {profile?.full_name || profile?.username}
          </h2>
          <p className="text-muted-foreground mb-2">@{profile?.username}</p>
          
          {/* Follow Stats */}
          {user && (
            <div className="flex justify-center mb-4">
              <FollowStats 
                userId={user.id} 
                onFollowersClick={() => {
                  setFollowersModalTab("followers");
                  setFollowersModalOpen(true);
                }}
                onFollowingClick={() => {
                  setFollowersModalTab("following");
                  setFollowersModalOpen(true);
                }}
              />
            </div>
          )}
          
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {profile?.bio || "Sin biografía aún"}
          </p>
        </Card>

        {/* Favorite Books */}
        {user && (
          <FavoriteBooks userId={user.id} isOwner={false} />
        )}

        {/* Reading Goal */}
        <ReadingGoalCard
          readingGoal={profile?.reading_goal ?? null}
          readingGoalYear={profile?.reading_goal_year ?? null}
          booksRead={bookStats.read}
          isOwner={true}
        />

        {/* Reading Stats Section */}
        {user && (
          <ReadingStatsSection userId={user.id} themeColor={themeColor} />
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 text-center shadow-card">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 text-${themeColor}-500`} />
              <p className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </section>

        {/* Recent Activity */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Tu actividad reciente
          </h3>
          <RecentActivity limit={5} />
        </section>

        {/* User's Reviews */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Tus reseñas
          </h3>
          <UserReviewsList limit={3} />
        </section>

        {/* My Books */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Mi biblioteca
            </h3>
            <Link to="/importar">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Importar de Goodreads
              </Button>
            </Link>
          </div>
          <BookShelf />
        </section>
      </main>

      {/* Followers Modal */}
      {user && profile && (
        <FollowersModal
          userId={user.id}
          username={profile.username}
          open={followersModalOpen}
          onOpenChange={setFollowersModalOpen}
          initialTab={followersModalTab}
        />
      )}
    </div>
  );
};

export default Profile;
