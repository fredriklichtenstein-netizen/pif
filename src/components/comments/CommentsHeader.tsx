
import { useTranslation } from 'react-i18next';

interface CommentsHeaderProps {
  isSubscribed?: boolean;
}

export function CommentsHeader({ isSubscribed }: CommentsHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-medium">{t('comments.title')}</h3>
    </div>
  );
}
