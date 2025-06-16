
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, MessageSquare, User } from "lucide-react";
import { setupNetworkMonitoring } from "@/hooks/auth/networkUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/AuthStatus";
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
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-primary">PIF</span>
          </Link>
        </div>
        
        {/* Main navigation */}
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            {t('nav.home')}
          </Link>
          <Link to="/map" className="text-sm font-medium transition-colors hover:text-primary">
            {t('nav.map')}
          </Link>
          <Link to="/post" className="text-sm font-medium transition-colors hover:text-primary">
            {t('nav.post')}
          </Link>
          <Link to="/messages" className="text-sm font-medium transition-colors hover:text-primary">
            {t('nav.messages')}
          </Link>
          <Link to="/profile" className="text-sm font-medium transition-colors hover:text-primary">
            {t('nav.profile')}
          </Link>
        </nav>
        
        <div className="ml-auto flex items-center space-x-4">
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
          <AuthStatus showButton={false} />
        </div>
      </div>
    </header>
  );
}
