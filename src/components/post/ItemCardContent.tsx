
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ItemCardContentProps {
  description: string;
  measurements?: Record<string, string>;
}

export function ItemCardContent({ description, measurements = {} }: ItemCardContentProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMoreDetails = Object.keys(measurements).length > 0;
  
  // Truncate description if it's too long and not expanded
  const shouldTruncate = description.length > 150 && !expanded;
  const displayDescription = shouldTruncate 
    ? description.substring(0, 150) + "..." 
    : description;
  
  return (
    <div className="mt-2">
      <p className="text-sm text-gray-700">{displayDescription}</p>
      
      {shouldTruncate && (
        <button 
          className="text-xs text-primary mt-1 flex items-center"
          onClick={() => setExpanded(true)}
        >
          Read more <ChevronDown className="h-3 w-3 ml-1" />
        </button>
      )}
      
      {expanded && (
        <button 
          className="text-xs text-primary mt-1 flex items-center"
          onClick={() => setExpanded(false)}
        >
          Show less <ChevronUp className="h-3 w-3 ml-1" />
        </button>
      )}
      
      {hasMoreDetails && expanded && (
        <div className="mt-2 text-sm text-gray-600">
          <h4 className="font-medium mb-1">Details:</h4>
          <ul className="space-y-1">
            {Object.entries(measurements).map(([key, value]) => (
              <li key={key} className="flex">
                <span className="font-medium mr-2">{key}:</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
