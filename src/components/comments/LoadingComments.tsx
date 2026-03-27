
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LoadingComments() {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center py-6 animate-fadeIn">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-muted-foreground text-sm">{t('comments.loading')}</p>
      
      {/* Skeleton loading placeholders */}
      <div className="w-full mt-6 space-y-4">
        <div className="flex items-start space-x-2 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-muted"></div>
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-full mb-1"></div>
            <div className="h-3 bg-muted rounded w-4/5"></div>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 animate-pulse delay-150">
          <div className="w-8 h-8 rounded-full bg-muted"></div>
          <div className="flex-1">
            <div className="h-4 w-32 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-full mb-1"></div>
            <div className="h-3 bg-muted rounded w-3/5"></div>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 animate-pulse delay-300">
          <div className="w-8 h-8 rounded-full bg-muted"></div>
          <div className="flex-1">
            <div className="h-4 w-28 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-full mb-1"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
