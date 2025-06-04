
import { Loader2 } from "lucide-react";

interface FeedLoadingStateProps {
  isRefreshing?: boolean;
}

export function FeedLoadingState({ isRefreshing = false }: FeedLoadingStateProps) {
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
