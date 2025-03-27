
import { ChevronDown, ChevronUp } from "lucide-react";

interface ItemCardContentProps {
  title?: string;
  description?: string;
  measurements?: Record<string, string>;
  isMobile?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function ItemCardContent({
  title,
  description,
  measurements = {},
  isMobile = false,
  expanded = false,
  onToggleExpand
}: ItemCardContentProps) {
  if (isMobile) {
    return (
      <div className="flex items-center">
        <button 
          onClick={onToggleExpand}
          className="flex items-center gap-1 text-gray-600 text-sm"
        >
          <span>{expanded ? 'Hide details' : 'Show details'}</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-lg font-semibold">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      
      {Object.keys(measurements).length > 0 && (
        <div className="text-xs text-gray-500 flex flex-wrap gap-2">
          {Object.entries(measurements).map(([key, value]) => (
            <span key={key} className="bg-gray-100 px-2 py-1 rounded-full">
              {key}: {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
