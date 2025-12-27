
import { WifiOff, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

type OfflineBannerMode = "offline" | "unreachable";

interface OfflineBannerProps {
  mode?: OfflineBannerMode;
  showMockData?: boolean;
}

export function OfflineBanner({ mode = "offline", showMockData = false }: OfflineBannerProps) {
  const { t } = useTranslation();

  const title =
    mode === "unreachable"
      ? t("offline.connection_failed", "Unable to connect to server")
      : t("offline.title", "You're currently offline");

  return (
    <Alert className="mb-4 border-border bg-muted/40">
      <WifiOff className="h-4 w-4 text-muted-foreground" />
      <AlertDescription className="text-foreground flex items-start gap-2">
        <div>
          <span className="font-medium">{title}</span>
          {showMockData && (
            <p className="text-sm mt-1 text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3 inline" />
              {t("offline.mock_data_notice", "Showing example content. Connect to see real pifs and wishes.")}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

