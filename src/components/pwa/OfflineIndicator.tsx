
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { t } = useTranslation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (isOnline) return null;

  return (
    <Badge variant="destructive" className="fixed top-4 right-4 z-50">
      <WifiOff className="h-3 w-3 mr-1" />{t('interactions.offline')}
    </Badge>
  );
}
