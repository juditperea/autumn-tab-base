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
import { useTranslation } from "react-i18next";

const Scan = () => {
  const { t } = useTranslation();
  const [showScanner, setShowScanner] = useState(false);
  const [manualISBN, setManualISBN] = useState("");
  const [scannedBook, setScannedBook] = useState<ExternalBook | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { searchByISBN, search, isSearching, error, results, clearResults } = useExternalBookSearch();
  const { identifyFromImage, isIdentifying, error: identifyError, identifiedBook, clear: clearIdentified } = useCoverIdentification();
  const { toast } = useToast();

  useEffect(() => {
    if (results.length > 0 && !scannedBook) {
      setScannedBook(results[0]);
      setShowScanner(false);
      setPreviewImage(null);
      toast({ title: t("scan.bookFound"), description: `"${results[0].title}" por ${results[0].authors.join(", ")}` });
    } else if (results.length === 0 && !isSearching && error) {
      setNotFound(true);
    }
  }, [results, scannedBook, isSearching, error, toast, t]);

  useEffect(() => {
    if (identifiedBook && !identifiedBook.error) {
      if (identifiedBook.isbn) {
        searchByISBN(identifiedBook.isbn);
      } else {
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
      toast({ variant: "destructive", title: t("scan.invalidISBN"), description: t("scan.invalidISBNDescription") });
      return;
    }
    setNotFound(false);
    setScannedBook(null);
    await searchByISBN(cleaned);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { setPreviewImage(e.target?.result as string); };
    reader.readAsDataURL(file);
    setScannedBook(null);
    setNotFound(false);
    clearResults();
    clearIdentified();
    const result = await identifyFromImage(file);
    if (result?.error || !result) {
      setNotFound(true);
      setPreviewImage(null);
      toast({ variant: "destructive", title: t("scan.couldNotRecognize"), description: t("scan.couldNotRecognizeDescription") });
      return;
    } else if (result.confidence === "low") {
      toast({ title: t("scan.uncertainIdentification"), description: t("scan.possibleBook", { title: result.title }) });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground">{t("scan.title")}</h1>
          <ThemeToggle />
        </div>
      </header>

      {showScanner && <BarcodeScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} isSearching={isSearching} />}

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {scannedBook && <ScanResultCard book={scannedBook} onDismiss={handleDismissResult} />}

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
              <span className="font-medium">{t("scan.identifyingBook")}</span>
            </div>
          </Card>
        )}

        {identifiedBook && !identifiedBook.error && isSearching && (
          <Card className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-primary">{t("scan.identifiedBook")}</span>
              <Badge variant="secondary" className="text-xs">
                {identifiedBook.confidence === "high" ? t("scan.highConfidence") : identifiedBook.confidence === "medium" ? t("scan.mediumConfidence") : t("scan.lowConfidence")}
              </Badge>
            </div>
            <p className="font-semibold">{identifiedBook.title}</p>
            <p className="text-sm text-muted-foreground">{identifiedBook.authors?.join(", ")}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("scan.searchingDB")}
            </div>
          </Card>
        )}

        {notFound && !scannedBook && !isLoading && (
          <Card className="p-6 text-center border-destructive/30">
            <BookX className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <h3 className="font-semibold text-foreground mb-2">{t("scan.notRecognized")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("scan.notRecognizedDescription")}</p>
            <Button variant="outline" onClick={handleDismissResult}>{t("scan.tryAgain")}</Button>
          </Card>
        )}

        {!scannedBook && !notFound && !isLoading && (
          <Card className="p-8 text-center shadow-card">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-autumn flex items-center justify-center">
              <ScanLine className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">{t("scan.scanYourBook")}</h2>
            <p className="text-muted-foreground mb-8">{t("scan.scanDescription")}</p>
            <div className="space-y-3">
              <Button className="w-full h-12 text-base shadow-warm" onClick={openScanner} disabled={isLoading}>
                <Camera className="w-5 h-5 mr-2" />
                {t("scan.scanBarcode")}
              </Button>
              <Button variant="outline" className="w-full h-12 text-base" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <Image className="w-5 h-5 mr-2" />
                {t("scan.identifyByCover")}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </div>
          </Card>
        )}

        {!scannedBook && !isLoading && (
          <Card className="p-4 shadow-card">
            <h3 className="font-medium text-foreground mb-3">{t("scan.scannerNotWorking")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("scan.manualISBN")}</p>
            <div className="flex gap-2">
              <Input value={manualISBN} onChange={(e) => setManualISBN(e.target.value)} placeholder="978-84-123456-7-8" className="flex-1" />
              <Button onClick={handleManualSearch} disabled={isLoading || !manualISBN.trim()}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {(error || identifyError) && (
          <Card className="p-4 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error || identifyError}</span>
            </div>
          </Card>
        )}

        {!scannedBook && !notFound && !isLoading && (
          <Card className="p-4 shadow-card bg-muted/50">
            <h3 className="font-medium text-foreground mb-2">{t("scan.tips")}</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>{t("scan.scanBarcode")}:</strong> {t("scan.tipBarcode")}</li>
              <li>• <strong>{t("scan.identifyByCover")}:</strong> {t("scan.tipCover")}</li>
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Scan;
