import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ItemCardContentProps {
  description?: string;
  measurements?: Record<string, string>;
  isMobile: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function ItemCardContent({
  description,
  measurements = {},
  isMobile,
  expanded,
  onToggleExpand,
}: ItemCardContentProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const hasMeasurements = Object.keys(measurements).length > 0;
  
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;
  
  const toggleExpanded = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };
  
  if (!isMobile) {
    return (
      <>
        {description && (
          <p className="mt-3 text-sm text-gray-600">{description}</p>
        )}
        
        {hasMeasurements && (
          <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
            {Object.entries(measurements).map(([key, value]) => (
              <span key={key} className="bg-gray-100 px-2 py-1 rounded-full">
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </>
    );
  }
  
  if (isMobile && !isExpanded) {
    return (
      <button 
        onClick={toggleExpanded}
        className="text-xs text-gray-600 flex items-center"
        aria-expanded={isExpanded}
        aria-controls="expandable-content"
      >
        <span>Show more</span>
        <ChevronDown size={14} className="ml-1" />
      </button>
    );
  }
  
  return (
    <>
      {isMobile && (
        <div className="w-full flex flex-col">
          <button 
            onClick={toggleExpanded}
            className="text-xs text-gray-600 flex items-center self-end mb-2"
            aria-expanded={isExpanded}
            aria-controls="expandable-content"
          >
            <span>Show less</span>
            <ChevronUp size={14} className="ml-1" />
          </button>
          
          <div id="expandable-content" className="w-full">
            {description && (
              <p className="text-sm text-gray-600 w-full">{description}</p>
            )}
            
            {hasMeasurements && (
              <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                {Object.entries(measurements).map(([key, value]) => (
                  <span key={key} className="bg-gray-100 px-2 py-1 rounded-full">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
