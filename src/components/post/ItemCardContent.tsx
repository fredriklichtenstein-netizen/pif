
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ItemCardContentProps {
  title?: string;
  description: string;
  measurements?: Record<string, string>;
}

export function ItemCardContent({ title, description, measurements = {} }: ItemCardContentProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Object.keys(measurements).length > 0;
  
  // Limit description to first 150 characters if not expanded
  const truncatedDescription = !expanded && description.length > 150 
    ? `${description.substring(0, 150)}...` 
    : description;
  
  return (
    <div className="mt-2 mb-4">
      {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
      
      <div className="text-lg text-gray-600">
        <p className="mb-2">{truncatedDescription}</p>
        
        {hasDetails && expanded && (
          <div className="mt-2 space-y-1">
            <p className="font-medium text-xs text-gray-500 uppercase tracking-wide">Details</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(measurements).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="font-medium mr-1">{key}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {(description.length > 150 || hasDetails) && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="mt-1 flex items-center text-primary text-xs font-medium"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" /> Show more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

