import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Target, Award, Clock, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { FollowButton } from "@/components/social/FollowButton";
import { FollowStats } from "@/components/social/FollowStats";
import { useUserActivities } from "@/hooks/useActivityFeed";
import { ActivityCard } from "@/components/social/ActivityCard";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch profile by username
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  // Fetch user's book stats
  const { data: bookStats } = useQuery({
    queryKey: ['user-book-stats', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_books')
        .select('status')
        .eq('user_id', profile!.id);

      if (error) throw error;
      
      return {
        read: data.filter(b => b.status === 'read').length,
        reading: data.filter(b => b.status === 'reading').length,
        toRead: data.filter(b => b.status === 'to_read').length,
      };
    },
    enabled: !!profile?.id,
  });

  // Fetch user's reviews count
  const { data: reviewsCount } = useQuery({
    queryKey: ['user-reviews-count', profile?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile!.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  // Fetch user's recent activities
  const { data: activities } = useUserActivities(profile?.id, 5);

  // Redirect to own profile if viewing self
  if (user && profile?.id === user.id) {
    navigate('/perfil', { replace: true });
    return null;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 text-center max-w-md mx-4">
          <h2 className="text-xl font-bold mb-2">Usuario no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El usuario @{username} no existe.
          </p>
          <Button onClick={() => navigate(-1)}>Volver</Button>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: "Libros leídos", value: bookStats?.read || 0, icon: BookOpen },
    { label: "Objetivo anual", value: `${bookStats?.read || 0}/20`, icon: Target },
    { label: "Reseñas", value: reviewsCount || 0, icon: Award },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Perfil</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <Card className="p-6 text-center shadow-card">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.username}
              className="w-24 h-24 mx-auto mb-4 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-autumn flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {profile.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {profile.full_name || profile.username}
          </h2>
          <p className="text-muted-foreground mb-2">@{profile.username}</p>
          
          {/* Follow Stats */}
          <div className="flex justify-center mb-4">
            <FollowStats userId={profile.id} />
          </div>
          
          {/* Follow Button */}
          <FollowButton targetUserId={profile.id} size="default" />
          
          {profile.bio && (
            <p className="text-sm text-foreground mt-4">{profile.bio}</p>
          )}
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

        {/* Recent Activity */}
        {activities && activities.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Actividad reciente
            </h3>
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default PublicProfile;
