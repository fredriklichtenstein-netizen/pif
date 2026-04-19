
import React, { useState, useEffect, useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
              {t('interactions.delete_dialog_checking_interest')}
            </p>
          </div> : hasInterestedUsers && <div className="mb-4">
            <p className="text-sm text-amber-600 font-medium">
              {t(interestCount === 1 ? 'interactions.delete_dialog_warning_interested_one' : 'interactions.delete_dialog_warning_interested_other', { count: interestCount })}
            </p>
            <p className="text-sm text-gray-500">{t('interactions.delete_dialog_will_be_notified')}</p>
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
                {t('interactions.delete_dialog_archive_instead')}
              </Label>
            </div>
            <p className="text-xs text-gray-500 pl-6">
              {isSoftDelete ? t('interactions.delete_dialog_archive_hint') : t('interactions.delete_dialog_delete_hint')}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="delete-reason">{t('interactions.delete_dialog_reason_label')}</Label>
          <Textarea 
            id="delete-reason" 
            placeholder={isSoftDelete ? t('interactions.delete_dialog_reason_placeholder_archive') : t('interactions.delete_dialog_reason_placeholder_delete')} 
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
            {t('interactions.delete_dialog_cancel')}
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
                {t('interactions.delete_dialog_processing')}
              </>
            ) : isSoftDelete ? t('interactions.delete_dialog_archive') : t('interactions.delete_dialog_delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
