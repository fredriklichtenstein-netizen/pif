
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
    <div className="mt-1 mb-4 px-1">
      <div className="text-sm text-gray-600">
        <ItemDescription 
          description={description}
          expanded={expanded}
          toggleExpanded={toggleExpanded}
          showToggle={showToggle}
        />
        
        {hasDetails && expanded && <ItemMeasurements measurements={measurements} />}
      </div>
    </div>
  );
}
