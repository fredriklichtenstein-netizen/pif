
import { toast } from "@/hooks/use-toast";

export const showDeleteToast = () => {
  return toast({
    title: "Item deleted",
    description: "The item has been removed",
    variant: "default",
    action: (
      <button 
        className="bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-xs"
        onClick={() => {
          // This would be implemented with actual undo functionality
          toast({
            title: "Cannot undo",
            description: "This action cannot be undone",
            variant: "destructive" 
          });
        }}
      >
        Undo
      </button>
    ),
  });
};

export const showArchiveToast = () => {
  return toast({
    title: "Item archived",
    description: "The item has been archived and can be restored later",
    variant: "default"
  });
};

export const showRestoreToast = () => {
  return toast({
    title: "Item restored",
    description: "The item has been restored successfully",
    variant: "default"
  });
};
