
import { Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommentsHeaderProps {
  isSubscribed: boolean;
}

export function CommentsHeader({ isSubscribed }: CommentsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-medium">Comments</h3>
      {isSubscribed && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border-green-200">
          <Wifi className="h-3 w-3" />
          Live
        </Badge>
      )}
    </div>
  );
}
