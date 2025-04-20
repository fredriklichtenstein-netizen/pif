
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function LoadingComments() {
  return (
    <Card className="mt-4 p-4 shadow-sm border-gray-100">
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-gray-500">Loading comments...</p>
      </div>
    </Card>
  );
}
