import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Lock, Globe } from "lucide-react";
import type { Club } from "@/hooks/useClubs";

interface ClubCardProps {
  club: Club;
}

export const ClubCard = ({ club }: ClubCardProps) => {
  const gradients = [
    "from-orange-500 to-amber-500",
    "from-green-600 to-teal-600",
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-rose-500 to-red-500",
  ];

  // Deterministic gradient based on club id
  const gradientIndex =
    club.id.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Link to={`/club/${club.id}`}>
      <Card className="p-4 shadow-card hover:shadow-warm tab-transition cursor-pointer">
        <div className="flex gap-4">
          <div
            className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
          >
            {club.cover_url ? (
              <img
                src={club.cover_url}
                alt={club.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Users className="w-8 h-8 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {club.name}
              </h3>
              {club.is_public ? (
                <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              {club.member_count} {club.member_count === 1 ? "miembro" : "miembros"}
            </p>

            {club.current_book ? (
              <div className="flex items-center gap-1.5 text-xs text-secondary">
                <BookOpen className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Leyendo: {club.current_book.title}</span>
              </div>
            ) : (
              <Badge variant="outline" className="text-xs">
                Sin libro activo
              </Badge>
            )}
          </div>
        </div>

        {club.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {club.description}
          </p>
        )}
      </Card>
    </Link>
  );
};
