import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GoodreadsImport } from "@/components/import/GoodreadsImport";

const Import = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Importar biblioteca</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-lg mx-auto">
        <GoodreadsImport />
        
        {/* Future imports */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Próximamente: importación desde StoryGraph, Literal y más</p>
        </div>
      </div>
    </div>
  );
};

export default Import;
