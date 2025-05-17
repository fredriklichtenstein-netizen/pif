
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useItemOperations } from "@/hooks/item/useItemOperations";

export interface SimpleDeleteDialogProps {
  itemId: string | number;
  itemTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isArchived?: boolean;
}

export function SimpleDeleteDialog({
  itemId,
  itemTitle,
  isOpen,
  onClose,
  onSuccess,
  isArchived = false
}: SimpleDeleteDialogProps) {
  const [reason, setReason] = useState("");
  const [isSoftDelete, setIsSoftDelete] = useState(true);
  const [interestedCount, setInterestedCount] = useState(0);
  const [checkingInterests, setCheckingInterests] = useState(false);
  
  const {
    isProcessing,
    error,
    checkInterestedCount,
    archiveItem,
    deleteItem,
    restoreItem
  } = useItemOperations({
    onSuccess: () => {
      onClose();
      if (onSuccess) onSuccess();
    }
  });

  // Get interested count when dialog opens
  useEffect(() => {
    if (isOpen && !isArchived) {
      setCheckingInterests(true);
      checkInterestedCount(itemId)
        .then(count => {
          setInterestedCount(count);
        })
        .catch(err => {
          console.error("Failed to check interest count:", err);
          // If we fail to get the count, we still proceed but don't show the warning
          setInterestedCount(0);
        })
        .finally(() => {
          setCheckingInterests(false);
        });
    }
  }, [isOpen, itemId, checkInterestedCount, isArchived]);
  
  // Reset state when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setIsSoftDelete(!isArchived); // Default to archive for normal items, delete for archived items
    }
  }, [isOpen, isArchived]);
  
  // Handle confirmation action
  const handleConfirm = async () => {
    console.log("Confirming action:", { 
      itemId,
      isArchived,
      isSoftDelete,
      reason
    });
    
    if (isArchived) {
      if (isSoftDelete) {
        // Restore archived item
        await restoreItem(itemId);
      } else {
        // Hard delete archived item
        await deleteItem(itemId, reason);
      }
    } else {
      if (isSoftDelete) {
        // Archive item
        await archiveItem(itemId, reason);
      } else {
        // Hard delete item
        await deleteItem(itemId, reason);
      }
    }
  };
  
  // Dialog title and description based on state
  const getDialogTitle = () => {
    if (isArchived) {
      return isSoftDelete ? "Restore Item" : "Delete Archived Item";
    }
    return "Delete Item";
  };
  
  const getDialogDescription = () => {
    if (isArchived) {
      return isSoftDelete 
        ? "Are you sure you want to restore this item? It will become visible again." 
        : "Are you sure you want to permanently delete this archived item? This action cannot be undone.";
    }
    return isSoftDelete 
      ? "You can archive this item to hide it from users. You can restore it later." 
      : "Are you sure you want to permanently delete this item? This action cannot be undone.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* Show interested users warning for non-archived items */}
        {!isArchived && checkingInterests && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Checking if anyone is interested in this item...
          </div>
        )}
        
        {!isArchived && !checkingInterests && interestedCount > 0 && (
          <div className="text-amber-600 text-sm font-medium">
            <p>Warning: {interestedCount} {interestedCount === 1 ? 'person is' : 'people are'} interested in this item.</p>
            <p className="text-muted-foreground font-normal">They will be notified if you proceed.</p>
          </div>
        )}
        
        {/* For non-archived items, show archive option */}
        {!isArchived && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="soft-delete" 
              checked={isSoftDelete} 
              onCheckedChange={(checked) => setIsSoftDelete(!!checked)} 
              disabled={isProcessing}
            />
            <Label htmlFor="soft-delete" className="cursor-pointer">
              Archive instead of permanently delete
            </Label>
          </div>
        )}
        
        {/* For archived items, show restore option */}
        {isArchived && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="restore-item" 
              checked={isSoftDelete} 
              onCheckedChange={(checked) => setIsSoftDelete(!!checked)} 
              disabled={isProcessing}
            />
            <Label htmlFor="restore-item" className="cursor-pointer">
              Restore item instead of permanently deleting
            </Label>
          </div>
        )}
        
        {/* Reason field (not needed for restore) */}
        {(!isArchived || !isSoftDelete) && (
          <div>
            <Label htmlFor="delete-reason">Reason (optional)</Label>
            <Textarea 
              id="delete-reason" 
              placeholder={
                isArchived 
                  ? "Why are you deleting this archived item?" 
                  : isSoftDelete 
                    ? "Why are you archiving this item?" 
                    : "Why are you deleting this item?"
              } 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              className="mt-1" 
              disabled={isProcessing}
            />
          </div>
        )}
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={isSoftDelete && !isArchived ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={isProcessing || checkingInterests}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isArchived ? 
                (isSoftDelete ? "Restore" : "Delete Permanently") : 
                (isSoftDelete ? "Archive" : "Delete Permanently")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
