
import { Badge } from "@/components/ui/badge";
import { Clock, Check, CheckCheck, Archive } from "lucide-react";
import type { CompletionStatus } from "@/stores/demoCompletionStore";

interface CompletionStatusBadgeProps {
  status: CompletionStatus;
  className?: string;
}

export function CompletionStatusBadge({ status, className }: CompletionStatusBadgeProps) {
  const config = {
    active: {
      label: "Aktiv",
      icon: null,
      variant: "outline" as const,
      className: "",
    },
    pending_confirmation: {
      label: "Väntar på bekräftelse",
      icon: Clock,
      variant: "secondary" as const,
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    completed: {
      label: "Slutförd",
      icon: CheckCheck,
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    archived: {
      label: "Arkiverad",
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
