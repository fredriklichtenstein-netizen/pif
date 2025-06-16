
import { Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface CommentsHeaderProps {
  isSubscribed: boolean;
}

export function CommentsHeader({ isSubscribed }: CommentsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-medium">{t('comments.title')}</h3>
      {isSubscribed && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border-green-200">
          <Wifi className="h-3 w-3" />
          {t('comments.live')}
        </Badge>
      )}
    </div>
  );
}
