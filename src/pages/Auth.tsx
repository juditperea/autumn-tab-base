import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUsernameAvailability } from "@/hooks/useUsernameAvailability";
import { z } from "zod";
import { BookOpen, Check, X, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }).max(100),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }).max(100),
  username: z
    .string()
    .trim()
    .min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres" })
    .max(50, { message: "El nombre de usuario debe tener menos de 50 caracteres" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Solo letras, números y guiones bajos" }),
  fullName: z.string().trim().max(100).optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  
  const { isAvailable, isChecking } = useUsernameAvailability(username);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const formUsername = formData.get("username") as string;
    const fullName = formData.get("fullName") as string;

    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Email o contraseña incorrectos");
          }
          throw error;
        }

        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Has iniciado sesión correctamente",
        });
        navigate("/");
      } else {
        signupSchema.parse({ email, password, username: formUsername, fullName });

        // Verificar disponibilidad de username antes de registrar
        if (isAvailable === false) {
          throw new Error("Este nombre de usuario ya está en uso");
        }

        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username: formUsername,
              full_name: fullName || "",
            }
          }
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            throw new Error("Este email ya está registrado");
          }
          if (error.message.includes("duplicate key") || error.message.includes("profiles_username_key")) {
            throw new Error("Este nombre de usuario ya está en uso");
          }
          throw error;
        }

        toast({
          title: "¡Cuenta creada!",
          description: "Tu perfil ha sido creado correctamente",
        });
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.errors[0].message,
        });
      } else if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // No mostrar nada mientras se verifica si el usuario ya está autenticado
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Lecturas</CardTitle>
          <CardDescription>
            Tu comunidad de lectura favorita
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Iniciando..." : "Iniciar sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Nombre de usuario</Label>
                  <div className="relative">
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      placeholder="maria_lectora"
                      required
                      disabled={loading}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isChecking && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {!isChecking && isAvailable === true && username.length >= 3 && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {!isChecking && isAvailable === false && (
                        <X className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {!isChecking && isAvailable === false && (
                    <p className="text-sm text-destructive">Este nombre de usuario ya está en uso</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Nombre completo (opcional)</Label>
                  <Input
                    id="signup-fullname"
                    name="fullName"
                    type="text"
                    placeholder="María García"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || isChecking || isAvailable === false}
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
