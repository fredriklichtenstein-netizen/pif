
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface ItemCardContentProps {
  title?: string;
  description?: string;
  measurements?: Record<string, string>;
}

export function ItemCardContent({
  description,
  measurements = {}
}: ItemCardContentProps) {
  const hasMeasurements = Object.keys(measurements).length > 0;
  const hasContent = description || hasMeasurements;
  
  if (!hasContent) return null;
  
  return (
    <>
      <Separator className="my-2" />
      <Collapsible className="w-full">
        <CollapsibleTrigger className="w-full flex items-center justify-center gap-1 text-sm text-gray-600 py-px">
          <span>Show details</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {description && <p className="text-sm text-gray-600">{description}</p>}
          
          {hasMeasurements && <div className="text-xs text-gray-500 flex flex-wrap gap-2">
              {Object.entries(measurements).map(([key, value]) => <span key={key} className="bg-gray-100 px-2 py-1 rounded-full">
                  {key}: {value}
                </span>)}
            </div>}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
