import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Search, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { FollowButton } from "@/components/social/FollowButton";
import { Link } from "react-router-dom";

const UserSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: users, isLoading } = useQuery({
    queryKey: ['search-users', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        // Return some suggested users when no search
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .or(`username.ilike.%${debouncedQuery}%,full_name.ilike.%${debouncedQuery}%`)
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Buscar usuarios</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users && users.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {debouncedQuery ? `Resultados para "${debouncedQuery}"` : "Lectores sugeridos"}
            </p>
            {users.map((user) => (
              <Card key={user.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Link to={`/perfil/${user.username}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link to={`/perfil/${user.username}`}>
                        <p className="font-medium hover:underline">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      </Link>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                    
                    <FollowButton targetUserId={user.id} size="sm" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">
                {debouncedQuery ? "Sin resultados" : "Descubre lectores"}
              </h3>
              <p className="text-muted-foreground">
                {debouncedQuery 
                  ? `No encontramos usuarios con "${debouncedQuery}"`
                  : "Busca por nombre o usuario para encontrar otros lectores"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default UserSearch;
