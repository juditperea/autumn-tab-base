import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  enriched: number;
  errors: string[];
}

export const GoodreadsImport = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error(t("import.invalidFile"));
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    try {
      const csvContent = await file.text();
      
      const { data, error } = await supabase.functions.invoke<ImportResult>("import-goodreads", {
        body: { csvContent },
      });

      if (error) throw new Error(error.message);

      if (data) {
        setResult(data);
        if (data.imported > 0) {
          toast.success(t("import.successCount", { count: data.imported }));
        }
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error(t("import.errorGeneral"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const progressPercent = result 
    ? Math.round(((result.imported + result.skipped) / result.total) * 100)
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t("import.goodreadsTitle")}
        </CardTitle>
        <CardDescription>{t("import.goodreadsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <h4 className="font-medium text-sm">{t("import.howToExport")}</h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              {t("import.step1")}{" "}
              <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                goodreads.com/review/import <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>{t("import.step2")}</li>
            <li>{t("import.step3")}</li>
            <li>{t("import.step4")}</li>
            <li>{t("import.step5")}</li>
          </ol>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="goodreads-csv"
          />
          
          {!file ? (
            <label
              htmlFor="goodreads-csv"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <FileText className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{t("import.selectFile")}</span>
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>{t("import.changeFile")}</Button>
            </div>
          )}
        </div>

        {/* Import Button */}
        {file && !result && (
          <Button onClick={handleImport} disabled={isImporting} className="w-full">
            {isImporting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("import.importing")}</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />{t("import.importLibrary")}</>
            )}
          </Button>
        )}

        {/* Progress */}
        {isImporting && (
          <div className="space-y-2">
            <Progress value={30} className="animate-pulse" />
            <p className="text-xs text-muted-foreground text-center">{t("import.processing")}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <Progress value={progressPercent} />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <div className="text-lg font-bold text-green-600">{result.imported}</div>
                <div className="text-xs text-muted-foreground">{t("import.imported")}</div>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <div className="text-lg font-bold text-primary">{result.enriched}</div>
                <div className="text-xs text-muted-foreground">{t("import.enriched")}</div>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <div className="text-lg font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-xs text-muted-foreground">{t("import.skipped")}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <div className="text-lg font-bold">{result.total}</div>
                <div className="text-xs text-muted-foreground">{t("import.total")}</div>
              </div>
            </div>

            {result.imported > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>{t("import.completed")}</AlertTitle>
                <AlertDescription>
                  {t("import.completedDesc", { imported: result.imported, enriched: result.enriched })}
                  {result.skipped > 0 && ` ${t("import.skippedDesc", { count: result.skipped })}`}
                </AlertDescription>
              </Alert>
            )}

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("import.someErrors")}</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 text-xs space-y-1 max-h-24 overflow-y-auto">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>...{t("import.andMore", { count: result.errors.length - 5 })}</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button variant="outline" onClick={handleReset} className="w-full">
              {t("import.importAnother")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
