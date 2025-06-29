
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installation accepted');
    } else {
      console.log('PWA installation dismissed');
    }
    
    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showInstallPrompt) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 shadow-lg z-40 max-w-sm">
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 text-primary mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Install PIF App</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Add PIF to your home screen for quick access and offline use
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstallClick}>
              Install
            </Button>
            <Button variant="outline" size="sm" onClick={handleDismiss}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
