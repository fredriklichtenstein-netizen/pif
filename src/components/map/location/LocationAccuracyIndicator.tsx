
import { Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react";

interface LocationAccuracyIndicatorProps {
  accuracy: number;
  isVisible: boolean;
}

export const LocationAccuracyIndicator = ({ accuracy, isVisible }: LocationAccuracyIndicatorProps) => {
  if (!isVisible) return null;

  const getAccuracyLevel = (acc: number) => {
    if (acc <= 10) return { level: 'high', icon: SignalHigh, color: 'text-green-500' };
    if (acc <= 50) return { level: 'medium', icon: SignalMedium, color: 'text-yellow-500' };
    if (acc <= 100) return { level: 'low', icon: SignalLow, color: 'text-orange-500' };
    return { level: 'poor', icon: Signal, color: 'text-red-500' };
  };

  const { icon: Icon, color } = getAccuracyLevel(accuracy);

  return (
    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200 flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm font-medium">
        ±{accuracy.toFixed(0)}m
      </span>
    </div>
  );
};
