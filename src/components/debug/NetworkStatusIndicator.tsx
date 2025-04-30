
import { Wifi, WifiOff } from "lucide-react";

interface NetworkStatusIndicatorProps {
  isOnline: boolean;
}

export function NetworkStatusIndicator({ isOnline }: NetworkStatusIndicatorProps) {
  return (
    <div className="flex items-center space-x-2 mb-4 p-2 rounded bg-gray-50">
      {isOnline ? 
        <Wifi className="h-5 w-5 text-green-500" /> : 
        <WifiOff className="h-5 w-5 text-red-500" />
      }
      <div>
        <div className="font-medium">
          {isOnline ? "Connected" : "Disconnected"}
        </div>
        <div className="text-xs text-gray-500">
          {isOnline ? 
            "Application is online and can reach backend services" : 
            "Application is offline or can't reach backend services"
          }
        </div>
      </div>
    </div>
  );
}
