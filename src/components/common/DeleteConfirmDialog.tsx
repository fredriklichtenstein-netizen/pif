
import React, { useState, useEffect, useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, isSoftDelete: boolean) => void;
  title: string;
  description: string;
  hasInterestedUsers?: boolean;
  interestCount?: number;
  isLoading?: boolean;
  isLoadingInterested?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  hasInterestedUsers = false,
  interestCount = 0,
  isLoading = false,
  isLoadingInterested = false
}: DeleteConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [isSoftDelete, setIsSoftDelete] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(isOpen);
  const unmountedRef = useRef(false);
  
  // Sync open state with prop
  useEffect(() => {
    if (!unmountedRef.current) {
      setDialogOpen(isOpen);
    }
  }, [isOpen]);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setIsSoftDelete(true);
      unmountedRef.current = false;
    }
    
    // Cleanup function for when component unmounts or dialog closes
    return () => {
      if (!isOpen) {
        unmountedRef.current = true;
      }
    };
  }, [isOpen]);
  
  // Handle safe close
  const handleSafeClose = () => {
    // Only handle close if not in loading state
    if (!isLoading && !unmountedRef.current) {
      setDialogOpen(false);
      
      // Small delay before calling onClose to allow animations
      setTimeout(() => {
        if (!unmountedRef.current) {
          onClose();
        }
      }, 10);
    }
  };
  
  // Handle confirmation with safety checks
  const handleConfirmAction = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (unmountedRef.current || isLoading) return;
    
    // Call onConfirm with current state
    onConfirm(reason, isSoftDelete);
  };
  
  // Close the dialog when Escape key is pressed
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isLoading) {
        handleSafeClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, isLoading]);
  
  return (
    <AlertDialog 
      open={dialogOpen} 
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          handleSafeClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {isLoadingInterested ? <div className="space-y-2 my-4">
            <p className="text-sm text-gray-500 flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking if anyone is interested in this item...
            </p>
          </div> : hasInterestedUsers && <div className="mb-4">
            <p className="text-sm text-amber-600 font-medium">
              Warning: {interestCount} {interestCount === 1 ? 'person is' : 'people are'} interested in this item.
            </p>
            <p className="text-sm text-gray-500">They will be notified if you proceed.</p>
          </div>}

        <div className="mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="soft-delete" 
                checked={isSoftDelete} 
                onCheckedChange={checked => setIsSoftDelete(Boolean(checked))} 
                disabled={isLoading}
              />
              <Label htmlFor="soft-delete" className={`cursor-pointer ${isLoading ? 'opacity-50' : ''}`}>
                Archive instead of permanently delete
              </Label>
            </div>
            <p className="text-xs text-gray-500 pl-6">
              {isSoftDelete ? "The item will be archived and can be restored later." : "The item will be permanently deleted and cannot be recovered."}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="delete-reason">Reason (optional)</Label>
          <Textarea 
            id="delete-reason" 
            placeholder={isSoftDelete ? "Why are you archiving this item?" : "Why are you deleting this item?"} 
            value={reason} 
            onChange={e => setReason(e.target.value)} 
            className="mt-1" 
            disabled={isLoading}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            type="button" 
            disabled={isLoading || isLoadingInterested} 
            onClick={(e) => {
              e.preventDefault();
              if (!isLoading && !isLoadingInterested) handleSafeClose();
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            type="button" 
            onClick={handleConfirmAction} 
            className="bg-red-600 hover:bg-red-700" 
            disabled={isLoading || isLoadingInterested}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isSoftDelete ? "Archive" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
