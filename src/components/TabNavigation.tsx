import { Home, Search, ScanLine, Users, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Inicio" },
  { path: "/buscar", icon: Search, label: "Buscar" },
  { path: "/escanear", icon: ScanLine, label: "Escanear" },
  { path: "/clubs", icon: Users, label: "Clubs" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

export const TabNavigation = () => {
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
