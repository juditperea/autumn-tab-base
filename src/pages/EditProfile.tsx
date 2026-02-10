import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, User, Sparkles, Loader2, Heart } from "lucide-react";
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
import { ThemeColorPicker, getThemeGradient } from "@/components/profile/ThemeColorPicker";
import { FavoriteBooks } from "@/components/profile/FavoriteBooks";
import { FavoriteBookSelector } from "@/components/profile/FavoriteBookSelector";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { useTranslation } from "react-i18next";

interface Profile {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_color: string | null;
}

const EditProfile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateProfile, uploadAvatar, isUpdating } = useProfileUpdate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ full_name: "", bio: "", theme_color: "orange" });
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(1);

  useEffect(() => { if (user) loadProfile(); }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
      if (error) throw error;
      setProfile(data);
      setFormData({ full_name: data.full_name || "", bio: data.bio || "", theme_color: data.theme_color || "orange" });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({ variant: "destructive", title: t("common.error"), description: t("profile.profileLoadError") });
    } finally { setLoading(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ variant: "destructive", title: t("common.error"), description: t("editProfile.invalidImage") }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ variant: "destructive", title: t("common.error"), description: t("editProfile.imageTooLarge") }); return; }
    const result = await uploadAvatar(file);
    if (result.success && result.avatarUrl) setProfile((prev) => (prev ? { ...prev, avatar_url: result.avatarUrl! } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateProfile(formData);
    if (result.success) navigate("/perfil");
  };

  const handleAddFavorite = (position: number) => { setSelectedPosition(position); setSelectorOpen(true); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("profile.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-xl font-bold text-foreground">{t("editProfile.title")}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 shadow-card">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Avatar className={`w-28 h-28 ring-4 ring-${formData.theme_color}-500/30`}>
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className={`text-4xl bg-gradient-to-br ${getThemeGradient(formData.theme_color)} text-white`}>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUpdating} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed">
                {isUpdating ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <p className="text-sm text-muted-foreground mt-3">{t("editProfile.tapToChange")}</p>
            <p className="text-xs text-muted-foreground">@{profile?.username}</p>
          </div>
        </Card>

        {user && (
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4"><Heart className="w-5 h-5 text-primary" /><h2 className="text-lg font-semibold text-foreground">{t("editProfile.favoriteBooks")}</h2></div>
            <p className="text-sm text-muted-foreground mb-4">{t("editProfile.favoriteBooksDesc")}</p>
            <FavoriteBooks userId={user.id} isOwner={true} isEditMode={true} onAddClick={handleAddFavorite} />
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="p-6 shadow-card space-y-5">
            <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-primary" /><h2 className="text-lg font-semibold text-foreground">{t("editProfile.personalInfo")}</h2></div>
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2"><User className="w-4 h-4" />{t("editProfile.fullName")}</Label>
              <Input id="full_name" placeholder={t("editProfile.fullNamePlaceholder")} value={formData.full_name} onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))} className="bg-background" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio">{t("editProfile.bio")}</Label>
                <EmojiPicker onEmojiSelect={(emoji) => { setFormData((prev) => ({ ...prev, bio: prev.bio + emoji })); }} />
              </div>
              <Textarea id="bio" placeholder={t("editProfile.bioPlaceholder")} value={formData.bio} onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))} className="bg-background resize-none min-h-[100px]" maxLength={300} />
              <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/300</p>
            </div>
            <ThemeColorPicker value={formData.theme_color} onChange={(color) => setFormData((prev) => ({ ...prev, theme_color: color }))} />
            <Button type="submit" className={`w-full bg-gradient-to-r ${getThemeGradient(formData.theme_color)} text-white`} disabled={isUpdating}>
              {isUpdating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("editProfile.saving")}</> : t("editProfile.saveChanges")}
            </Button>
          </Card>
        </form>

        <Card className="p-4 bg-primary/5 border-primary/20 shadow-card">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />{t("editProfile.tips")}</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {t("editProfile.tip1")}</li>
            <li>• {t("editProfile.tip2")}</li>
            <li>• {t("editProfile.tip3")}</li>
          </ul>
        </Card>
      </main>

      <FavoriteBookSelector open={selectorOpen} onOpenChange={setSelectorOpen} position={selectedPosition} />
    </div>
  );
};

export default EditProfile;
