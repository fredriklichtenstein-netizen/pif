
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const SHARE_BASE_URL = 'https://app.pif.community';

export const useItemSharing = (itemId: string) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const shareUrl = `${SHARE_BASE_URL}/item/${itemId}`;
    console.log('Share URL:', shareUrl, 'itemId:', itemId, typeof itemId);
    setIsSharing(true);

    try {
      // Mobile: use native Web Share API when available
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'Check out this item on PIF',
          url: shareUrl,
        });
        return;
      }

      // Desktop: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('interactions.link_copied', 'Länk kopierad till urklipp!'),
      });
    } catch (error) {
      // User cancelled native share — silent
      if ((error as Error)?.name === 'AbortError') return;

      console.error('Error sharing:', error);
      toast({
        title: t('interactions.sharing_failed', 'Kunde inte dela'),
        description: shareUrl,
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  }, [itemId, toast, t]);

  return {
    isSharing,
    handleShare,
  };
};
