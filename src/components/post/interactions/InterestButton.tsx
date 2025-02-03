import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterestButtonProps {
  showInterest: boolean;
  onShowInterest: () => void;
}

export function InterestButton({ showInterest, onShowInterest }: InterestButtonProps) {
  return (
    <Button
      variant={showInterest ? "default" : "secondary"}
      size="sm"
      onClick={onShowInterest}
      className={`font-semibold ${
        showInterest ? "bg-accent hover:bg-accent-hover text-accent-foreground" : ""
      }`}
    >
      <ThumbsUp size={16} className="mr-2" />
      {showInterest ? "Interested" : "Show Interest"}
    </Button>
  );
}