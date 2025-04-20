
import { NetworkStatus } from "../common/NetworkStatus";
import { AlertTriangle, Wifi } from "lucide-react";
import { CommentsHeader } from "./CommentsHeader";
import { Button } from "@/components/ui/button";

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
  return (
    <>
      {(error || realtimeError) && (
        <NetworkStatus onRetry={refreshComments} />
      )}
      <div className="flex justify-between items-center">
        <CommentsHeader isSubscribed={isSubscribed || useFallbackMode} />
        {onClose && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="ml-auto"
          >
            Close
          </Button>
        )}
      </div>
      {useFallbackMode && (
        <div className="mt-4 px-3 py-2 bg-blue-50 text-blue-700 rounded-md flex items-center text-sm border border-blue-200">
          <Wifi className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Using local conversation mode. Your comments will be stored when connection improves.</span>
        </div>
      )}
      {!isSubscribed && isInitialized && !error && !useFallbackMode && (
        <div className="mt-4 px-3 py-2 bg-amber-50 text-amber-800 rounded-md flex items-center text-sm border border-amber-200">
          <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Live updates unavailable. Comments may not refresh automatically.</span>
        </div>
      )}
    </>
  );
}
