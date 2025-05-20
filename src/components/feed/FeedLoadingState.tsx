
import React from "react";
import { Loader2 } from "lucide-react";

export function FeedLoadingState() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
