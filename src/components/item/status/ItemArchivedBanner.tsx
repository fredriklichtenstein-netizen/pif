import { Archive } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/utils/formatDate";

interface ItemArchivedBannerProps {
  reason?: string;
  archivedAt?: string | null;
}

export function ItemArchivedBanner({ reason, archivedAt }: ItemArchivedBannerProps) {
  const { t } = useTranslation();
  const timeAgo = archivedAt ? formatRelativeTime(new Date(archivedAt)) : null;

  return (
    <div className="bg-yellow-50 p-2 flex items-center gap-2 text-sm text-amber-700">
      <Archive className="h-4 w-4" />
      <span>
        {timeAgo
          ? t('interactions.archived_banner', { time: timeAgo })
          : t('interactions.archived_banner_no_time')}
        {reason && (
          <>
            {' · '}
            <span className="font-medium">{t('interactions.archived_reason_label')}:</span>{' '}
            <span className="italic">{reason}</span>
          </>
        )}
      </span>
    </div>
  );
}
