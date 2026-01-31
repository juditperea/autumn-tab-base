import { Home, Search, ScanLine, Bell, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { path: "/", icon: Home, label: "Inicio" },
  { path: "/buscar", icon: Search, label: "Buscar" },
  { path: "/escanear", icon: ScanLine, label: "Escanear" },
  { path: "/actividad", icon: Bell, label: "Actividad" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

export const TabNavigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Don't show navigation on auth page or if not authenticated
  if (!user || location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-warm">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl tab-transition",
                "text-muted-foreground hover:text-foreground",
                isActive && "text-primary bg-primary/10"
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon 
                  className={cn(
                    "w-6 h-6 tab-transition",
                    isActive && "scale-110"
                  )} 
                />
                <span className="text-xs font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
