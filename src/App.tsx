import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TabNavigation } from "./components/TabNavigation";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Feed from "./pages/Feed";
import Search from "./pages/Search";
import Scan from "./pages/Scan";
import Clubs from "./pages/Clubs";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import UserSearch from "./pages/UserSearch";
import Auth from "./pages/Auth";
import BookDetail from "./pages/BookDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/buscar" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/escanear" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
            <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/perfil/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
            <Route path="/buscar-usuarios" element={<ProtectedRoute><UserSearch /></ProtectedRoute>} />
            <Route path="/libro/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <TabNavigation />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
