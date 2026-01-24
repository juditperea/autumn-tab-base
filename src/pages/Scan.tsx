import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Camera, Image, Search, AlertCircle, Loader2, BookX } from "lucide-react";
import { BarcodeScanner } from "@/components/scanner/BarcodeScanner";
import { ScanResultCard } from "@/components/scanner/ScanResultCard";
import { useExternalBookSearch, ExternalBook } from "@/hooks/useExternalBooks";
import { useCoverIdentification } from "@/hooks/useCoverIdentification";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Scan = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [manualISBN, setManualISBN] = useState("");
  const [scannedBook, setScannedBook] = useState<ExternalBook | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { searchByISBN, search, isSearching, error, results, clearResults } = useExternalBookSearch();
  const { identifyFromImage, isIdentifying, error: identifyError, identifiedBook, clear: clearIdentified } = useCoverIdentification();
  const { toast } = useToast();

  // Effect to handle search results
  useEffect(() => {
    if (results.length > 0 && !scannedBook) {
      setScannedBook(results[0]);
      setShowScanner(false);
      setPreviewImage(null);
      toast({
        title: "¡Libro encontrado!",
        description: `"${results[0].title}" por ${results[0].authors.join(", ")}`,
      });
    } else if (results.length === 0 && !isSearching && error) {
      setNotFound(true);
    }
  }, [results, scannedBook, isSearching, error, toast]);

  // Effect to search when book is identified from cover
  useEffect(() => {
    if (identifiedBook && !identifiedBook.error) {
      // If we have ISBN, search by ISBN
      if (identifiedBook.isbn) {
        searchByISBN(identifiedBook.isbn);
      } else {
        // Otherwise search by title and author
        const query = `${identifiedBook.title} ${identifiedBook.authors?.join(" ") || ""}`;
        search(query);
      }
    }
  }, [identifiedBook]);

  const handleScanResult = async (isbn: string) => {
    setNotFound(false);
    setScannedBook(null);
    await searchByISBN(isbn);
  };

  const handleManualSearch = async () => {
    const cleaned = manualISBN.replace(/[-\s]/g, "");
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      toast({
        variant: "destructive",
        title: "ISBN inválido",
        description: "El ISBN debe tener 10 o 13 dígitos",
      });
      return;
    }
    
    setNotFound(false);
    setScannedBook(null);
    await searchByISBN(cleaned);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset states
    setScannedBook(null);
    setNotFound(false);
    clearResults();
    clearIdentified();

    // Identify book from cover
    const result = await identifyFromImage(file);
    
    if (result?.error || !result) {
      toast({
        variant: "destructive",
        title: "No se pudo identificar",
        description: "Intenta con otra imagen más clara de la portada",
      });
    } else if (result.confidence === "low") {
      toast({
        title: "Identificación incierta",
        description: `Posible libro: "${result.title}"`,
      });
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDismissResult = () => {
    setScannedBook(null);
    setNotFound(false);
    setPreviewImage(null);
    clearResults();
    clearIdentified();
    setManualISBN("");
  };

  const openScanner = () => {
    setScannedBook(null);
    setNotFound(false);
    setPreviewImage(null);
    clearResults();
    clearIdentified();
    setShowScanner(true);
  };

  const isLoading = isSearching || isIdentifying;

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">Escanear</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Fullscreen Scanner */}
      {showScanner && (
        <BarcodeScanner
          onResult={handleScanResult}
          onClose={() => setShowScanner(false)}
          isSearching={isSearching}
        />
      )}

      {/* Scan Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Result Card */}
        {scannedBook && (
          <ScanResultCard book={scannedBook} onDismiss={handleDismissResult} />
        )}

        {/* Identifying from image */}
        {isIdentifying && previewImage && (
          <Card className="p-6 text-center">
            <div className="relative w-32 h-48 mx-auto mb-4 rounded-lg overflow-hidden">
              <img src={previewImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Identificando libro...</span>
            </div>
          </Card>
        )}

        {/* Identified book info (before search completes) */}
        {identifiedBook && !identifiedBook.error && isSearching && (
          <Card className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-primary">Libro identificado</span>
              <Badge variant="secondary" className="text-xs">
                {identifiedBook.confidence === "high" ? "Alta confianza" : 
                 identifiedBook.confidence === "medium" ? "Media confianza" : "Baja confianza"}
              </Badge>
            </div>
            <p className="font-semibold">{identifiedBook.title}</p>
            <p className="text-sm text-muted-foreground">{identifiedBook.authors?.join(", ")}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando en la base de datos...
            </div>
          </Card>
        )}

        {/* Not Found Message */}
        {notFound && !scannedBook && !isLoading && (
          <Card className="p-6 text-center border-destructive/30">
            <BookX className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <h3 className="font-semibold text-foreground mb-2">
              Libro no encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              No pudimos encontrar el libro. Intenta buscarlo por título en la pestaña Buscar.
            </p>
            <Button variant="outline" onClick={handleDismissResult}>
              Intentar de nuevo
            </Button>
          </Card>
        )}

        {/* Main Scan Card */}
        {!scannedBook && !notFound && !isLoading && (
          <Card className="p-8 text-center shadow-card">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-autumn flex items-center justify-center">
              <ScanLine className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              Escanea tu libro
            </h2>
            <p className="text-muted-foreground mb-8">
              Escanea el código de barras o sube una foto de la portada
            </p>

            <div className="space-y-3">
              <Button 
                className="w-full h-12 text-base shadow-warm"
                onClick={openScanner}
                disabled={isLoading}
              >
                <Camera className="w-5 h-5 mr-2" />
                Escanear código de barras
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 text-base"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Image className="w-5 h-5 mr-2" />
                Identificar por portada
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </Card>
        )}

        {/* Manual ISBN Entry */}
        {!scannedBook && !isLoading && (
          <Card className="p-4 shadow-card">
            <h3 className="font-medium text-foreground mb-3">
              ¿No funciona el escáner?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Introduce el ISBN manualmente (10 o 13 dígitos)
            </p>
            <div className="flex gap-2">
              <Input
                value={manualISBN}
                onChange={(e) => setManualISBN(e.target.value)}
                placeholder="978-84-123456-7-8"
                className="flex-1"
              />
              <Button 
                onClick={handleManualSearch}
                disabled={isLoading || !manualISBN.trim()}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {(error || identifyError) && (
          <Card className="p-4 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error || identifyError}</span>
            </div>
          </Card>
        )}

        {/* Tips */}
        {!scannedBook && !notFound && !isLoading && (
          <Card className="p-4 shadow-card bg-muted/50">
            <h3 className="font-medium text-foreground mb-2">Consejos:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Código de barras:</strong> Está en la contraportada</li>
              <li>• <strong>Foto de portada:</strong> Asegura buena iluminación y que se lea el título</li>
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Scan;
