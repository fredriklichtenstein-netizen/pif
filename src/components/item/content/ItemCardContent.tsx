
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
  const { expanded, toggleExpanded, showToggle } = useExpandableContent(description, hasDetails);

  return (
    <div className="mt-1 mb-2 px-1">
      <div className="text-sm text-gray-600">
        {/* Show toggle button first */}
        {showToggle && (
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
        )}
        
        {/* Content is shown if expanded or if there's no toggle */}
        {(!showToggle || expanded) && (
          <div className="pt-1">
            <ItemDescription 
              description={description}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              showToggle={false} /* Hide toggle in the description component as we're showing it separately */
            />
            
            {hasDetails && expanded && <ItemMeasurements measurements={measurements} />}
          </div>
        )}
      </div>
    </div>
  );
}
