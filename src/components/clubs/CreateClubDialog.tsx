import { useState } from "react";
import { useCreateClub } from "@/hooks/useClubs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, Lock, Globe } from "lucide-react";

interface CreateClubDialogProps {
  trigger?: React.ReactNode;
}

export const CreateClubDialog = ({ trigger }: CreateClubDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const { mutate: createClub, isPending } = useCreateClub();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del club es obligatorio",
        variant: "destructive",
      });
      return;
    }

    createClub(
      { name: name.trim(), description: description.trim(), is_public: isPublic },
      {
        onSuccess: () => {
          toast({
            title: "¡Club creado!",
            description: `El club "${name}" ha sido creado exitosamente`,
          });
          setOpen(false);
          setName("");
          setDescription("");
          setIsPublic(true);
        },
        onError: (error) => {
          toast({
            title: "Error al crear club",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="icon" variant="ghost" className="rounded-full">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Crear nuevo club
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="club-name">Nombre del club *</Label>
            <Input
              id="club-name"
              placeholder="Ej: Fantasía Épica"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="club-description">Descripción</Label>
            <Textarea
              id="club-description"
              placeholder="Describe de qué trata tu club..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {isPublic ? "Club público" : "Club privado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Cualquiera puede unirse"
                    : "Solo por invitación"}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Creando..." : "Crear club"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
