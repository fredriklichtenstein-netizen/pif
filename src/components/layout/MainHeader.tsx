
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff } from "lucide-react";
import { setupNetworkMonitoring } from "@/hooks/auth/networkUtils";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/common/LanguageSelector";

export function MainHeader() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const cleanup = setupNetworkMonitoring((online) => {
      setIsOnline(online);
      
      if (online && !isOnline) {
        toast({
          title: t('common.connection_restored'),
          description: t('common.back_online'),
          duration: 3000,
        });
      }
    });
    
    return cleanup;
  }, [isOnline, toast, t]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-end">
        <div className="flex items-center space-x-4">
          {/* Network status indicator */}
          {!isOnline && (
            <div className="flex items-center text-destructive text-sm" title="Connection issue">
              <WifiOff className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t('common.offline')}</span>
            </div>
          )}
          
          {isOnline && (
            <div className="flex items-center text-green-500 text-sm" title="Connected">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t('common.online')}</span>
            </div>
          )}
          
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
