
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => { window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt); };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('PWA installation accepted');
    else console.log('PWA installation dismissed');
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => { setShowInstallPrompt(false); setDeferredPrompt(null); };

  if (!showInstallPrompt) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 shadow-lg z-40 max-w-sm">
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 text-primary mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{t('interactions.install_app')}</h3>
          <p className="text-xs text-muted-foreground mb-3">{t('interactions.install_description')}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstallClick}>{t('interactions.install')}</Button>
            <Button variant="outline" size="sm" onClick={handleDismiss}><X className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
