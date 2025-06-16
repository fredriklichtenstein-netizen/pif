
import React from "react";

interface ImageFormTipsProps {
  isRequest: boolean;
  hasImages: boolean;
}

export function ImageFormTips({ isRequest, hasImages }: ImageFormTipsProps) {
  if (!hasImages) {
    return null;
  }

  if (isRequest) {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
        <p><strong>Tips:</strong> Din referensbild hjälper andra att förstå vad du söker, även om de inte har exakt samma sak.</p>
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
      <p><strong>Tips:</strong> Bilden märkt med stjärna (★) visas först i flödet. Dra bilderna för att ändra ordning.</p>
    </div>
  );
}
