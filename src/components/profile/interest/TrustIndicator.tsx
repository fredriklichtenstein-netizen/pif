
import { Star, AlertTriangle, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface TrustIndicatorProps {
  reliabilityScore?: number;
  completedPifs?: number;
  noShows?: number;
  compact?: boolean;
}

export function TrustIndicator({ 
  reliabilityScore = 0, 
  completedPifs = 0, 
  noShows = 0,
  compact = false 
}: TrustIndicatorProps) {
  const { t } = useTranslation();
  
  const getTrustLevel = () => {
    if (completedPifs >= 10 && noShows === 0 && reliabilityScore >= 4.5) return "high";
    if (completedPifs >= 3 && noShows <= 1 && reliabilityScore >= 3.5) return "medium";
    if (noShows >= 2 || reliabilityScore < 3) return "low";
    return "new";
  };

  const trustLevel = getTrustLevel();

  const trustConfig = {
    high: {
      icon: CheckCircle,
      label: t('interactions.trust_high'),
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: t('interactions.trust_high_description'),
    },
    medium: {
      icon: Star,
      label: t('interactions.trust_medium'),
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      description: t('interactions.trust_medium_description'),
    },
    low: {
      icon: AlertTriangle,
      label: t('interactions.trust_low'),
      color: "text-red-500",
      bgColor: "bg-red-50",
      description: t('interactions.trust_low_description'),
    },
    new: {
      icon: Star,
      label: t('interactions.trust_new'),
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      description: t('interactions.trust_new_description'),
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
            <p className="text-xs mt-1">
              {completedPifs === 1 
                ? t('interactions.successful_pifs', { count: completedPifs })
                : t('interactions.successful_pifs_plural', { count: completedPifs })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
