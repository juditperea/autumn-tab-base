import { useState, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Camera, Image, Search, AlertCircle, Loader2, BookX } from "lucide-react";
import { BarcodeScanner } from "@/components/scanner/BarcodeScanner";
import { ScanResultCard } from "@/components/scanner/ScanResultCard";
import { useExternalBookSearch, ExternalBook } from "@/hooks/useExternalBooks";
import { useToast } from "@/hooks/use-toast";

const Scan = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [manualISBN, setManualISBN] = useState("");
  const [scannedBook, setScannedBook] = useState<ExternalBook | null>(null);
  const [notFound, setNotFound] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { searchByISBN, isSearching, error, results, clearResults } = useExternalBookSearch();
  const { toast } = useToast();

  const handleScanResult = async (isbn: string) => {
    setNotFound(false);
    setScannedBook(null);
    
    await searchByISBN(isbn);
  };

  // Watch for search results
  const handleSearchComplete = () => {
    if (results.length > 0) {
      setScannedBook(results[0]);
      setShowScanner(false);
      toast({
        title: "¡Libro encontrado!",
        description: `"${results[0].title}" por ${results[0].authors.join(", ")}`,
      });
    } else if (!isSearching && manualISBN) {
      setNotFound(true);
    }
  };

  // Effect to handle results
  if (results.length > 0 && !scannedBook) {
    handleSearchComplete();
  }

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
    
    // Check results after search
    if (results.length === 0) {
      setNotFound(true);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, show a message that image scanning is coming soon
    // In the future, this could use OCR or barcode detection from images
    toast({
      title: "Próximamente",
      description: "El escaneo desde imagen estará disponible pronto. Por ahora, usa la cámara o introduce el ISBN manualmente.",
    });
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDismissResult = () => {
    setScannedBook(null);
    setNotFound(false);
    clearResults();
    setManualISBN("");
  };

  const openScanner = () => {
    setScannedBook(null);
    setNotFound(false);
    clearResults();
    setShowScanner(true);
  };

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

        {/* Not Found Message */}
        {notFound && !scannedBook && (
          <Card className="p-6 text-center border-destructive/30">
            <BookX className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <h3 className="font-semibold text-foreground mb-2">
              Libro no encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              No pudimos encontrar un libro con ese ISBN. Intenta buscarlo por título en la pestaña Buscar.
            </p>
            <Button variant="outline" onClick={handleDismissResult}>
              Intentar de nuevo
            </Button>
          </Card>
        )}

        {/* Main Scan Card */}
        {!scannedBook && !notFound && (
          <Card className="p-8 text-center shadow-card">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-autumn flex items-center justify-center">
              <ScanLine className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              Escanea tu libro
            </h2>
            <p className="text-muted-foreground mb-8">
              Escanea el código de barras ISBN de la contraportada para añadir el libro automáticamente
            </p>

            <div className="space-y-3">
              <Button 
                className="w-full h-12 text-base shadow-warm"
                onClick={openScanner}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 mr-2" />
                )}
                Abrir cámara
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 text-base"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-5 h-5 mr-2" />
                Subir desde galería
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </Card>
        )}

        {/* Manual ISBN Entry */}
        {!scannedBook && (
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
                disabled={isSearching || !manualISBN.trim()}
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          </Card>
        )}

        {/* Tips */}
        {!scannedBook && !notFound && (
          <Card className="p-4 shadow-card bg-muted/50">
            <h3 className="font-medium text-foreground mb-2">Consejos:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• El código de barras está en la contraportada del libro</li>
              <li>• Asegúrate de tener buena iluminación</li>
              <li>• Mantén el móvil estable al enfocar</li>
              <li>• El ISBN comienza normalmente con 978 o 979</li>
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Scan;
