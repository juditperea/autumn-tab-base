import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, BookOpen, Target, Award, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookShelf } from "@/components/books/BookShelf";
import { useUserBooksStats } from "@/hooks/useUserBooks";
import { useUserReviews } from "@/hooks/useReviews";

interface Profile {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const bookStats = useUserBooksStats();
  const { data: userReviews } = useUserReviews(user?.id);

  const stats = [{
    label: "Libros leídos",
    value: bookStats.read,
    icon: BookOpen
  }, {
    label: "Objetivo anual",
    value: `${bookStats.read}/20`,
    icon: Target
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
          <h1 className="text-xl font-bold text-foreground">Perfil</h1>
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
        <Card className="p-6 text-center shadow-card">
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.username}
              className="w-24 h-24 mx-auto mb-4 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-autumn flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {profile?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {profile?.full_name || profile?.username}
          </h2>
          <p className="text-muted-foreground mb-4">@{profile?.username}</p>
          <p className="text-sm text-foreground">
            {profile?.bio || "Sin biografía aún"}
          </p>
        </Card>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 text-center shadow-card">
              <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </section>

        {/* My Books */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Mi biblioteca
          </h3>
          <BookShelf />
        </section>
      </main>
    </div>
  );
};

export default Profile;
