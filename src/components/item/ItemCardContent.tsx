
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ItemCardContentProps {
  description: string;
  measurements?: Record<string, string>;
}

export function ItemCardContent({ description, measurements = {} }: ItemCardContentProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Object.keys(measurements).length > 0;
  
  // Limit description to first 150 characters if not expanded
  const truncatedDescription = !expanded && description.length > 150 
    ? `${description.substring(0, 150)}...` 
    : description;
  
  return (
    <div className="mt-1 mb-2 px-1">
      <div className="text-base text-gray-600">
        <p className="mb-1">{truncatedDescription}</p>
        
        {hasDetails && expanded && (
          <div className="mt-1 space-y-1">
            <div className="grid grid-cols-2 gap-1 text-xs">
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
