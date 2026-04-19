
import { NetworkStatus } from "../common/NetworkStatus";
import { CommentsHeader } from "./CommentsHeader";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

interface CommentsBannerSectionProps {
  error: Error | null;
  realtimeError: any;
  refreshComments: () => void;
  isSubscribed: boolean;
  onClose?: () => void;
  useFallbackMode: boolean;
  isInitialized: boolean;
}

export function CommentsBannerSection({
  error,
  realtimeError,
  refreshComments,
  isSubscribed,
  onClose,
  useFallbackMode,
  isInitialized
}: CommentsBannerSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      {(error || realtimeError) && (
        <NetworkStatus onRetry={refreshComments} />
      )}
      <div className="flex justify-between items-center">
        <CommentsHeader />
        {onClose && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="ml-auto"
          >
            {t('common.close')}
          </Button>
        )}
      </div>
    </>
  );
}
