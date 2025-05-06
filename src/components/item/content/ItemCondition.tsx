
import { CircleCheck, CircleDot, Circle, HeartCrack } from "lucide-react";

interface ItemConditionProps {
  condition: string;
}

export function ItemCondition({ condition }: ItemConditionProps) {
  const getConditionIcon = () => {
    const iconClass = "h-4 w-4 text-gray-500"; // Using neutral gray color for all icons
    
    switch (condition.toLowerCase()) {
      case "new":
      case "like new":
        return <CircleCheck className={iconClass} />;
      case "good":
        return <CircleDot className={iconClass} />;
      case "fair":
        return <Circle className={iconClass} />;
      case "well loved":
        return <HeartCrack className={iconClass} />;
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
