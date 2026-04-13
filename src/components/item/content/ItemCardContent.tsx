
import { ItemDescription } from "./ItemDescription";
import { ItemCondition } from "./ItemCondition";
import { ItemMeasurements } from "./ItemMeasurements";
import { useExpandableContent } from "./useExpandableContent";
import { useTranslation } from 'react-i18next';

interface ItemCardContentProps {
  description: string;
  condition?: string;
  measurements?: Record<string, string>;
}

export function ItemCardContent({
  description,
  condition,
  measurements = {}
}: ItemCardContentProps) {
  const { t } = useTranslation();
  const hasDetails = Object.keys(measurements).length > 0;
  const { expanded, toggleExpanded } = useExpandableContent(description, hasDetails);

  return (
    <div className="mt-1 mb-4 px-1">
      <div className="text-sm text-gray-600 text-left">
        <button 
          onClick={toggleExpanded} 
          className="mb-2 flex items-center text-primary text-xs font-medium"
        >
          {expanded ? t('interactions.show_less') : t('interactions.show_more')}
        </button>
        
        {expanded && (
          <>
            <ItemDescription 
              description={description}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              showToggle={false}
            />
            
            {condition && <ItemCondition condition={condition} />}
            
            {hasDetails && <ItemMeasurements measurements={measurements} />}
          </>
        )}
      </div>
    </div>
  );
}
