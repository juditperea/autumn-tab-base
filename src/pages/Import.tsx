import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GoodreadsImport } from "@/components/import/GoodreadsImport";
import { useTranslation } from "react-i18next";

const Import = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-semibold">{t("import.title")}</h1>
        </div>
      </header>
      <div className="p-4 max-w-lg mx-auto">
        <GoodreadsImport />
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>{t("import.oauthNotAvailable")}</p>
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t("import.comingSoon")}</p>
        </div>
      </div>
    </div>
  );
};

export default Import;
