import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateProfile, uploadAvatar, isUpdating } = useProfileUpdate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        bio: data.bio || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor selecciona una imagen válida",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La imagen no puede superar los 5MB",
      });
      return;
    }

    const result = await uploadAvatar(file);
    if (result.success && result.avatarUrl) {
      setProfile((prev) => (prev ? { ...prev, avatar_url: result.avatarUrl! } : null));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateProfile(formData);
    if (result.success) {
      navigate("/perfil");
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
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Editar perfil</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Avatar Section */}
        <Card className="p-6 shadow-card">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Avatar className="w-28 h-28 ring-4 ring-primary/20">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-4xl gradient-autumn text-white">
                  {profile?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Camera overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdating}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <p className="text-sm text-muted-foreground mt-3">
              Toca la imagen para cambiar tu foto
            </p>
            <p className="text-xs text-muted-foreground">
              @{profile?.username}
            </p>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-6 shadow-card space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Información personal
              </h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre completo
              </Label>
              <Input
                id="full_name"
                placeholder="Tu nombre completo"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                placeholder="Cuéntanos algo sobre ti y tus gustos literarios..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="bg-background resize-none min-h-[100px]"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.bio.length}/300
              </p>
            </div>

            <Button
              type="submit"
              className="w-full gradient-autumn text-white"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </Card>
        </form>

        {/* Tips */}
        <Card className="p-4 bg-primary/5 border-primary/20 shadow-card">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Consejos
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Usa una foto clara donde se vea tu cara</li>
            <li>• Escribe una bio que refleje tus gustos literarios</li>
            <li>• Tu nombre será visible en tus reseñas y actividad</li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default EditProfile;
