
import { Loader2 } from "lucide-react";

export function LoadingComments() {
  return (
    <div className="flex flex-col items-center justify-center py-6 animate-fadeIn">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-gray-500 text-sm">Loading comments...</p>
      
      {/* Skeleton loading placeholders */}
      <div className="w-full mt-6 space-y-4">
        <div className="flex items-start space-x-2 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 animate-pulse delay-150">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-3/5"></div>
          </div>
        </div>
        
        <div className="flex items-start space-x-2 animate-pulse delay-300">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
