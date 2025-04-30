
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  // Limit description to first 150 characters if not expanded
  const truncatedDescription = !expanded && description.length > 150 
    ? `${description.substring(0, 150)}...` 
    : description;
    
  return (
    <div>
      <p className="mb-1 py-[6px]">{truncatedDescription}</p>
      
      {showToggle && (
        <button 
          onClick={toggleExpanded} 
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
  );
}
