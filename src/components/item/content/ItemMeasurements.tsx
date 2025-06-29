
import { useState } from "react";
import { useTranslation } from 'react-i18next';

interface ItemMeasurementsProps {
  measurements: Record<string, string>;
}

export function ItemMeasurements({ measurements }: ItemMeasurementsProps) {
  const [showMeasurements, setShowMeasurements] = useState(false);
  const { t } = useTranslation();
  const hasMeasurements = Object.keys(measurements).length > 0;

  if (!hasMeasurements) return null;

  const toggleMeasurements = () => {
    setShowMeasurements(!showMeasurements);
  };

  const translateMeasurementKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      'Weight': t('post.weight'),
      'Size': t('common.size'),
      'Width': 'Bredd',
      'Height': 'Höjd',
      'Length': 'Längd',
      'Depth': 'Djup'
    };
    return keyMap[key] || key;
  };

  return (
    <div className="mb-3">
      <button 
        onClick={toggleMeasurements}
        className="text-sm text-primary hover:underline font-medium"
      >
        {showMeasurements ? t('interactions.show_less') : t('interactions.show_more')}
      </button>
      
      {showMeasurements && (
        <div className="mt-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('common.size_measurements')}</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(measurements).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                <span className="text-gray-600">{translateMeasurementKey(key)}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
