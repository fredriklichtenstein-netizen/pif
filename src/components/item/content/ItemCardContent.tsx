
import { ItemDescription } from "./ItemDescription";
import { ItemCondition } from "./ItemCondition";
import { ItemMeasurements } from "./ItemMeasurements";
import { useExpandableContent } from "./useExpandableContent";

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
  const hasDetails = Object.keys(measurements).length > 0;
  // Force showToggle to true regardless of description length
  const { expanded, toggleExpanded } = useExpandableContent(description, hasDetails);

  return (
    <div className="mt-1 mb-4 px-1">
      <div className="text-sm text-gray-600">
        <button 
          onClick={toggleExpanded} 
          className="mb-2 flex items-center text-primary text-xs font-medium"
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
            
            {condition && <ItemCondition condition={condition} />}
            
            {hasDetails && <ItemMeasurements measurements={measurements} />}
          </>
        )}
      </div>
    </div>
  );
}
