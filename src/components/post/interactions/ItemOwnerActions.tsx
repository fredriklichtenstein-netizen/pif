
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";

interface ItemOwnerActionsProps {
  id: string;
}

export function ItemOwnerActions({ id }: ItemOwnerActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const deleteInProgressRef = useRef(false);

  const handleDelete = useCallback(() => {
    // Prevent multiple clicks
    if (deleteInProgressRef.current) {
      console.log("Delete already in progress, ignoring duplicate request");
      return;
    }
    
    deleteInProgressRef.current = true;
    console.log("ItemOwnerActions - handleDelete called for item:", id);
    
    // Try to use the global dialog manager first (most direct approach)
    const dialogManager = getDeleteDialogManager();
    
    if (dialogManager) {
      console.log("Using global dialog manager to open delete dialog");
      dialogManager.openDeleteDialog({
        id,
        onSuccess: () => {
          // Reset state and refresh view
          setIsDeleting(false);
          deleteInProgressRef.current = false;
          // Refresh the page to ensure clean state
          window.location.reload();
        }
      });
      return;
    }
    
    // Fallback to the custom event approach
    console.log("Global dialog manager not available, using custom event");
    const deleteEvent = new CustomEvent("global-delete-dialog-open", {
      detail: { 
        itemId: id,
        onSuccess: () => {
          // Reset state and refresh view
          setIsDeleting(false);
          deleteInProgressRef.current = false;
          // Refresh the page to ensure clean state
          window.location.reload();
        }
      },
      bubbles: true,
      cancelable: true
    });
    
    // Dispatch the event to trigger dialog opening
    document.dispatchEvent(deleteEvent);
    
    // Reset the in-progress flag after a short timeout
    setTimeout(() => {
      deleteInProgressRef.current = false;
    }, 500);
  }, [id]);

  const handleEdit = useCallback(() => {
    navigate(`/post/edit/${id}`);
  }, [id, navigate]);

  return (
    <div className="flex gap-2 mt-2">
      <Button variant="outline" size="sm" onClick={handleEdit}>
        Edit
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
