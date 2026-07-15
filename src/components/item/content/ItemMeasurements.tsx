
import { useTranslation } from 'react-i18next';

interface ItemMeasurementsProps {
  measurements: Record<string, string>;
}

// Internal-only: its value gets mirrored into `size` at creation time (see
// handleCustomSizeChange in PostFormInformation.tsx), so showing it as its
// own row would just duplicate the size value under a raw, untranslated key.
const HIDDEN_KEYS = new Set(['customSize']);

const stripTrailingColon = (s: string) => s.replace(/:\s*$/, '');

export function ItemMeasurements({ measurements }: ItemMeasurementsProps) {
  const { t } = useTranslation();

  const entries = Object.entries(measurements).filter(
    ([key, value]) => !HIDDEN_KEYS.has(key) && !!value,
  );
  if (entries.length === 0) return null;

  const translateMeasurementKey = (key: string): string => {
    if (key === 'size') return stripTrailingColon(t('common.size'));
    if (key === 'weight') return t('post.weight');
    if (key === 'preferences') return t('post.other_preferences');
    // Category-specific fields (Chest, Length, Shoulders, Width, Age, ...)
    // share the same translation keys used by the post form itself.
    return t(`post.measurement.${key}`, { defaultValue: key });
  };

  return (
    <div className="mb-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{t('common.size_measurements')}</h4>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-1">
            <span className="text-gray-600">{translateMeasurementKey(key)}:</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
