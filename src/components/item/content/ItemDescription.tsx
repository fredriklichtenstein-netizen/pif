
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ItemDescriptionProps {
  description: string;
  expanded: boolean;
  toggleExpanded: () => void;
  showToggle: boolean;
}

export function ItemDescription({ 
  description, 
  expanded, 
  toggleExpanded,
  showToggle 
}: ItemDescriptionProps) {
  const { t } = useTranslation();
  
  return (
    <div>
      <p className="mb-2 py-[6px]">{description}</p>
      
      {showToggle && (
        <button 
          onClick={toggleExpanded} 
          className="mt-1 flex items-center text-primary text-xs font-medium"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" /> {t('interactions.show_less')}
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" /> {t('interactions.show_more')}
            </>
          )}
        </button>
      )}
    </div>
  );
}
