
import React from "react";
import { Leaf } from "lucide-react";

export function FeedHeader() {
  return (
    <div className="mb-4 mt-4">
      <div className="flex items-center gap-2">
        <Leaf className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-bold">PiF Community</h1>
      </div>
      <p className="text-muted-foreground">Sustainable sharing in your neighborhood</p>
      <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
        Every shared item saves resources and reduces waste. 
        Join the circular economy movement!
      </div>
    </div>
  );
}
