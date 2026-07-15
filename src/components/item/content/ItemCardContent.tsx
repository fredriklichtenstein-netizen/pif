
import { Plus, Minus } from "lucide-react";
import { ItemDescription } from "./ItemDescription";
import { ItemCondition } from "./ItemCondition";
import { ItemMeasurements } from "./ItemMeasurements";
import { useExpandableContent } from "./useExpandableContent";
import { useTranslation } from 'react-i18next';

interface ItemCardContentProps {
  description: string;
  condition?: string;
  measurements?: Record<string, string>;
}

// Collapsed peek height — enough to hint that there's more below (a couple
// of lines) without needing to measure actual rendered content height.
const COLLAPSED_PEEK_HEIGHT = "6rem";

export function ItemCardContent({
  description,
  condition,
  measurements = {}
}: ItemCardContentProps) {
  const { t } = useTranslation();
  const hasDescription = !!description?.trim();
  const hasDetails = Object.keys(measurements).length > 0;
  const hasCondition = !!condition;
  const hasAnything = hasDescription || hasDetails || hasCondition;
  const { expanded, toggleExpanded } = useExpandableContent(description, hasDetails);

  if (!hasAnything) return null;

  return (
    <div className="mt-1 mb-4 px-1">
      <div className="text-sm text-gray-600 text-left">
        <div
          className="relative overflow-hidden"
          style={{ maxHeight: expanded ? "none" : COLLAPSED_PEEK_HEIGHT }}
        >
          {hasDescription && (
            <ItemDescription
              description={description}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              showToggle={false}
            />
          )}

          {hasCondition && <ItemCondition condition={condition!} />}

          {hasDetails && <ItemMeasurements measurements={measurements} />}

          {/* Fades the clipped peek into the card's background instead of a
              hard cut, signalling there's more content below the toggle. */}
          {!expanded && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent"
              aria-hidden="true"
            />
          )}
        </div>

        <button
          onClick={toggleExpanded}
          className="mt-2 flex items-center gap-1.5 text-primary text-sm font-semibold"
        >
          {expanded ? (
            <Minus className="h-4 w-4 shrink-0" />
          ) : (
            <Plus className="h-4 w-4 shrink-0" />
          )}
          {expanded ? t('interactions.show_less') : t('interactions.show_more')}
        </button>
      </div>
    </div>
  );
}
