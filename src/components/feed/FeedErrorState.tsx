
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FeedErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
}

export function FeedErrorState({ errorMessage, onRetry }: FeedErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-destructive/10 p-4 rounded-md my-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{t('interactions.error_title')}</h3>
        <Button variant="ghost" size="sm" onClick={onRetry} className="p-1 h-8 w-8">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">{t('interactions.refresh')}</span>
        </Button>
      </div>
      <p className="text-sm mb-3">{errorMessage}</p>
      <Button onClick={onRetry}>{t('interactions.refresh')}</Button>
    </div>
  );
}
