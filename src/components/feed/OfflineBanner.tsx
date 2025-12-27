
import { WifiOff, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

interface OfflineBannerProps {
  showMockData?: boolean;
}

export function OfflineBanner({ showMockData = false }: OfflineBannerProps) {
  const { t } = useTranslation();
  
  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200 flex items-start gap-2">
        <div>
          <span className="font-medium">{t('offline.title', 'You\'re currently offline')}</span>
          {showMockData && (
            <p className="text-sm mt-1 opacity-80 flex items-center gap-1">
              <Info className="h-3 w-3 inline" />
              {t('offline.mock_data_notice', 'Showing example content. Connect to see real pifs and wishes.')}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
