
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ItemDetailErrorProps {
  onRetry: () => void;
}

export function ItemDetailError({ onRetry }: ItemDetailErrorProps) {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('interactions.error_label')}</AlertTitle>
        <AlertDescription>
          {t('interactions.unable_load_item')}
        </AlertDescription>
      </Alert>
      <Button 
        onClick={onRetry} 
        className="flex items-center gap-2"
        variant="outline"
      >
        <RefreshCw className="h-4 w-4" />
        {t('interactions.retry')}
      </Button>
    </div>
  );
}
