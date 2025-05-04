
import { Check, X, Info } from "lucide-react";

interface ItemConditionProps {
  condition: string;
}

export function ItemCondition({ condition }: ItemConditionProps) {
  const getConditionIcon = () => {
    switch (condition.toLowerCase()) {
      case "new":
      case "like new":
      case "excellent":
        return <Check className="h-4 w-4 text-green-500" />;
      case "good":
      case "fair":
        return <Info className="h-4 w-4 text-amber-500" />;
      case "poor":
      case "for parts":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
      <span className="font-semibold text-gray-700">Condition:</span>
      <div className="flex items-center gap-1">
        {getConditionIcon()}
        <span>{condition}</span>
      </div>
    </div>
  );
}
