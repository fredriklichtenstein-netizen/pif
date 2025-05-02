
import { ItemDescription } from "./ItemDescription";
import { ItemMeasurements } from "./ItemMeasurements";
import { useExpandableContent } from "./useExpandableContent";

interface ItemCardContentProps {
  description: string;
  measurements?: Record<string, string>;
}

export function ItemCardContent({
  description,
  measurements = {}
}: ItemCardContentProps) {
  const hasDetails = Object.keys(measurements).length > 0;
  const { expanded, toggleExpanded } = useExpandableContent(description, hasDetails);

  return (
    <div className="mt-0 mb-2 px-1"> {/* Reduced top margin */}
      <div className="text-sm text-gray-600">
        <button 
          onClick={toggleExpanded} 
          className="flex items-center text-primary text-xs font-medium"
        >
          {expanded ? (
            <>
              Show less
            </>
          ) : (
            <>
              Show more
            </>
          )}
        </button>
        
        {expanded && (
          <>
            <ItemDescription 
              description={description}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              showToggle={false}
            />
            
            {hasDetails && <ItemMeasurements measurements={measurements} />}
          </>
        )}
      </div>
    </div>
  );
}
