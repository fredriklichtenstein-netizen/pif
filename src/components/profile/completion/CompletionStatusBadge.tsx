
import { Badge } from "@/components/ui/badge";
import { Clock, Check, CheckCheck, Archive } from "lucide-react";
import type { CompletionStatus } from "@/stores/demoCompletionStore";
import { useTranslation } from "react-i18next";

interface CompletionStatusBadgeProps {
  status: CompletionStatus;
  className?: string;
}

export function CompletionStatusBadge({ status, className }: CompletionStatusBadgeProps) {
  const { t } = useTranslation();
  
  const config = {
    active: {
      label: t('interactions.status_active'),
      icon: null,
      variant: "outline" as const,
      className: "",
    },
    pending_confirmation: {
      label: t('interactions.status_pending'),
      icon: Clock,
      variant: "secondary" as const,
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    completed: {
      label: t('interactions.status_completed'),
      icon: CheckCheck,
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    archived: {
      label: t('interactions.status_archived'),
      icon: Archive,
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground",
    },
  };

  const { label, icon: Icon, variant, className: statusClassName } = config[status];

  if (status === "active") return null;

  return (
    <Badge variant={variant} className={`${statusClassName} ${className || ""}`}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}
