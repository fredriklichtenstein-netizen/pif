
import { Star, AlertTriangle, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TrustIndicatorProps {
  reliabilityScore?: number;
  completedPifs?: number;
  noShows?: number;
  compact?: boolean;
}

/**
 * Contextual trust indicator shown only during selection process
 * Displays abstracted reliability signals without exposing exact ratings
 */
export function TrustIndicator({ 
  reliabilityScore = 0, 
  completedPifs = 0, 
  noShows = 0,
  compact = false 
}: TrustIndicatorProps) {
  // Determine trust level based on metrics
  const getTrustLevel = () => {
    if (completedPifs >= 10 && noShows === 0 && reliabilityScore >= 4.5) {
      return "high";
    }
    if (completedPifs >= 3 && noShows <= 1 && reliabilityScore >= 3.5) {
      return "medium";
    }
    if (noShows >= 2 || reliabilityScore < 3) {
      return "low";
    }
    return "new";
  };

  const trustLevel = getTrustLevel();

  const trustConfig = {
    high: {
      icon: CheckCircle,
      label: "Trusted",
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Reliable community member with many successful pifs",
    },
    medium: {
      icon: Star,
      label: "Active",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      description: "Active member with good track record",
    },
    low: {
      icon: AlertTriangle,
      label: "Caution",
      color: "text-red-500",
      bgColor: "bg-red-50",
      description: "Has had some no-shows or issues",
    },
    new: {
      icon: Star,
      label: "New",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      description: "New to the community",
    },
  };

  const config = trustConfig[trustLevel];
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${config.bgColor} ${config.color}`}>
              <Icon className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.bgColor} ${config.color}`}>
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          {completedPifs > 0 && (
            <p className="text-xs mt-1">{completedPifs} successful pif{completedPifs !== 1 ? 's' : ''}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
