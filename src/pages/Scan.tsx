import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, Camera, Image } from "lucide-react";

const Scan = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Escanear</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Scan Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <Card className="p-8 text-center shadow-card">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-autumn flex items-center justify-center">
            <ScanLine className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">
            Escanea tu libro
          </h2>
          <p className="text-muted-foreground mb-8">
            Usa la cámara para capturar la portada de un libro y añadirlo a tu biblioteca automáticamente
          </p>

          <div className="space-y-3">
            <Button className="w-full h-12 text-base shadow-warm">
              <Camera className="w-5 h-5 mr-2" />
              Abrir cámara
            </Button>
            <Button variant="outline" className="w-full h-12 text-base">
              <Image className="w-5 h-5 mr-2" />
              Subir desde galería
            </Button>
          </div>
        </Card>

        {/* Recent Scans */}
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Escaneos recientes
          </h3>
          <Card className="p-6 text-center shadow-card">
            <p className="text-muted-foreground">
              Aún no has escaneado ningún libro
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Scan;
