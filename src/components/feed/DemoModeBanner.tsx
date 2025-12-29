
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

export function DemoModeBanner() {
  const { t } = useTranslation();

  return (
    <Alert className="mb-4 border-primary/20 bg-primary/5">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertDescription className="text-foreground">
        <span className="font-medium">
          {t("demo.title", "You're viewing demo content")}
        </span>
        <p className="text-sm mt-1 text-muted-foreground">
          {t("demo.description", "This is example data to showcase the app. Connect a backend to see real community posts.")}
        </p>
      </AlertDescription>
    </Alert>
  );
}
