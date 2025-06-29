
import { useTranslation } from 'react-i18next';
import { useCategoryTranslations } from '@/utils/translations/categories';

interface ItemConditionProps {
  condition: string;
}

export function ItemCondition({ condition }: ItemConditionProps) {
  const { t } = useTranslation();
  const { translateCondition } = useCategoryTranslations();

  return (
    <div className="flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
      <span className="font-semibold text-gray-700">{t('common.condition')}</span>
      <span>{translateCondition(condition)}</span>
    </div>
  );
}
