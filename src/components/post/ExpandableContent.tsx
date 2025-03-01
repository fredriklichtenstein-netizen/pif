
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ExpandableContentProps {
  description?: string;
  measurements?: Record<string, string>;
  isMobile: boolean;
}

export function ExpandableContent({
  description,
  measurements = {},
  isMobile,
}: ExpandableContentProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMeasurements = Object.keys(measurements).length > 0;
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
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
  
  return (
    <>
      <div className="flex justify-end -mt-1 mb-2">
        <button 
          onClick={toggleExpanded}
          className="text-xs text-gray-600 flex items-center"
        >
          <span>{expanded ? "Show less" : "Show more"}</span>
          {expanded ? (
            <ChevronUp size={14} className="ml-1" />
          ) : (
            <ChevronDown size={14} className="ml-1" />
          )}
        </button>
      </div>
        
      {expanded && (
        <div className="mt-3 space-y-2">
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          
          {hasMeasurements && (
            <div className="text-xs text-gray-500 flex flex-wrap gap-2">
              {Object.entries(measurements).map(([key, value]) => (
                <span key={key} className="bg-gray-100 px-2 py-1 rounded-full">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
