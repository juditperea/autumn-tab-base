import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoverUploadProps {
  userId: string;
  bookId: string;
  currentCoverUrl?: string | null;
  customCoverUrl?: string | null;
  onCoverUploaded: (url: string | null) => void;
}

export const CoverUpload = ({
  userId,
  bookId,
  currentCoverUrl,
  customCoverUrl,
  onCoverUploaded,
}: CoverUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayedCover = customCoverUrl || currentCoverUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Formato no válido",
        description: "Por favor selecciona una imagen (JPG, PNG, WebP)",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: "La imagen debe ser menor a 5MB",
      });
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to Supabase Storage
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${bookId}.${fileExt}`;

      // Delete old cover if exists
      if (customCoverUrl) {
        const oldPath = customCoverUrl.split("/book-covers/")[1];
        if (oldPath) {
          await supabase.storage.from("book-covers").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("book-covers")
        .getPublicUrl(filePath);

      onCoverUploaded(publicUrl);
      
      toast({
        title: "Portada actualizada",
        description: "Tu portada personalizada se ha guardado",
      });
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast({
        variant: "destructive",
        title: "Error al subir",
        description: "No se pudo subir la imagen. Inténtalo de nuevo.",
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCustomCover = async () => {
    if (!customCoverUrl) return;

    setUploading(true);
    try {
      const oldPath = customCoverUrl.split("/book-covers/")[1];
      if (oldPath) {
        await supabase.storage.from("book-covers").remove([oldPath]);
      }

      onCoverUploaded(null);
      setPreviewUrl(null);

      toast({
        title: "Portada eliminada",
        description: "Se ha restaurado la portada original",
      });
    } catch (error) {
      console.error("Error removing cover:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la portada",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      {/* Cover Image */}
      <div className="relative">
        {previewUrl || displayedCover ? (
          <img
            src={previewUrl || displayedCover || ""}
            alt="Portada"
            className="w-28 h-40 rounded-lg object-cover flex-shrink-0 shadow-warm"
          />
        ) : (
          <div className="w-28 h-40 rounded-lg gradient-autumn flex-shrink-0 shadow-warm flex items-center justify-center">
            <ImagePlus className="w-8 h-8 text-white/70" />
          </div>
        )}

        {/* Overlay with upload button */}
        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </Button>

          {customCoverUrl && (
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={handleRemoveCustomCover}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Custom badge */}
        {customCoverUrl && (
          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
            Personalizada
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};
