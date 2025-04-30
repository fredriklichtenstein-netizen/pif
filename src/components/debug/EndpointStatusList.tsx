
import { Clock, Check, X } from "lucide-react";
import type { EndpointStatus } from "@/hooks/debug/useNetworkDebugger";

interface EndpointStatusListProps {
  endpoints: EndpointStatus[];
}

export function EndpointStatusList({ endpoints }: EndpointStatusListProps) {
  return (
    <div className="space-y-2">
      {endpoints.map((endpoint, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div>
            <div className="font-medium text-sm">{endpoint.name}</div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">{endpoint.url}</div>
          </div>
          <div className="flex items-center">
            {endpoint.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
            {endpoint.status === 'success' && <Check className="h-4 w-4 text-green-500" />}
            {endpoint.status === 'error' && <X className="h-4 w-4 text-red-500" />}
            
            {endpoint.latency !== null && (
              <span className="ml-2 text-xs text-gray-500">
                {endpoint.latency}ms
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
