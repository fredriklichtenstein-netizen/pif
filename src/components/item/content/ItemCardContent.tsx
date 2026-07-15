
import { useLayoutEffect, useRef, useState } from "react";
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

// Collapsed peek height — generous enough to show several real lines of
// content (not a token sliver) before the fade kicks in.
const COLLAPSED_PEEK_HEIGHT_PX = 208;

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
  const { expanded, toggleExpanded } = useExpandableContent();

  const contentRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  // scrollHeight reflects the content's full natural height regardless of
  // the current collapsed clip, so this measurement stays accurate whether
  // expanded or not — only show the toggle/fade when there's actually more
  // to reveal, instead of always displaying it.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setOverflows(el.scrollHeight > COLLAPSED_PEEK_HEIGHT_PX + 1);
  }, [description, condition, measurements]);

  if (!hasAnything) return null;

  return (
    <div className="mt-1 mb-4 px-1">
      <div className="text-sm text-gray-600 text-left">
        <div
          ref={contentRef}
          className="relative overflow-hidden"
          style={{ maxHeight: expanded ? "none" : `${COLLAPSED_PEEK_HEIGHT_PX}px` }}
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
          {!expanded && overflows && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent"
              aria-hidden="true"
            />
          )}
        </div>

        {overflows && (
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
        )}
      </div>
    </div>
  );
}
