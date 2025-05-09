
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { getDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";

interface DirectDeleteButtonProps {
  itemId: string | number;
  onSuccess?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DirectDeleteButton({
  itemId,
  onSuccess,
  variant = "outline",
  size = "sm",
  className
}: DirectDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleClick = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    console.log("DirectDeleteButton clicked for item:", itemId);
    
    // Try to use global dialog manager first
    const dialogManager = getDeleteDialogManager();
    
    if (dialogManager) {
      console.log("Using global dialog manager to open delete dialog");
      dialogManager.openDeleteDialog({
        id: itemId,
        onSuccess
      });
      
      // Reset deleting state after a delay
      setTimeout(() => setIsDeleting(false), 500);
      return;
    }
    
    // Fallback to custom event
    console.log("Global dialog manager not available, using custom event");
    document.dispatchEvent(
      new CustomEvent("global-delete-dialog-open", {
        detail: { id: itemId, onSuccess },
        bubbles: true
      })
    );
    
    // Reset deleting state after a delay
    setTimeout(() => setIsDeleting(false), 500);
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isDeleting}
      className={className}
      data-testid="direct-delete-button"
    >
      <Trash2 className="h-4 w-4 mr-1" />
      Delete
    </Button>
  );
}
