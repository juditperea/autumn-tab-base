import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProfileUpdateData {
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
}

export const useProfileUpdate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user) return { success: false, error: "No user logged in" };

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
      });
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { success: false, error: "No user logged in" };

    setIsUpdating(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil se ha actualizado correctamente",
      });

      return { success: true, avatarUrl };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo subir la foto",
      });
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateProfile,
    uploadAvatar,
    isUpdating,
  };
};
