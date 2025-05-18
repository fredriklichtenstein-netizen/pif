
import { useItemDeletion } from "./useItemDeletion";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ItemDeleteDialogProps {
  id: string | number;
  isOpen: boolean;
  onClose: () => void;
  checkInterestedUsers?: () => Promise<number>;
  onSuccess?: () => void;
}

/**
 * Dialog component for deleting or archiving an item
 */
export function ItemDeleteDialog({ 
  id, 
  isOpen, 
  onClose,
  checkInterestedUsers,
  onSuccess
}: ItemDeleteDialogProps) {
  const mountedRef = useRef(true);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [showInterestInfo, setShowInterestInfo] = useState(false);
  
  // Get deletion functionality
  const { 
    isDeleting, 
    handleDeleteConfirm,
    isOperationComplete,
    cleanupState
  } = useItemDeletion(id, onClose, onSuccess);

  // Check for interested users in the background
  useEffect(() => {
    if (isOpen) {
      setShowInterestInfo(false);
      setIsLoadingCount(false);
      
      // Only run the check if we have an ID and the component is mounted
      if (id && mountedRef.current) {
        setIsLoadingCount(true);
        
        // Use the passed function if available, otherwise do a direct query
        const checkInterested = async () => {
          try {
            let count = 0;
            
            if (checkInterestedUsers) {
              count = await checkInterestedUsers();
            } else {
              const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
              const { count: dbCount, error } = await supabase
                .from('interests')
                .select('*', { count: 'exact', head: true })
                .eq('item_id', numericId);
                
              if (!error) {
                count = dbCount || 0;
              }
            }
            
            // Only update if component is still mounted
            if (mountedRef.current) {
              setInterestedCount(count);
              if (count > 0) {
                setShowInterestInfo(true);
              }
              setIsLoadingCount(false);
            }
          } catch (error) {
            console.error('Error checking interested users:', error);
            // Continue without showing the warning
            if (mountedRef.current) {
              setIsLoadingCount(false);
            }
          }
        };
        
        checkInterested();
      }
    }
    
    return () => {
      // Mark component as unmounted
      mountedRef.current = false;
    };
  }, [isOpen, id, checkInterestedUsers]);

  // Ensure cleanup happens on unmount
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      mountedRef.current = false;
      
      // Always ensure body styling is reset
      document.body.style.pointerEvents = '';
      
      // Run cleanup
      cleanupState();
    };
  }, [cleanupState]);
  
  // Reset styling when dialog state changes
  useEffect(() => {
    if (!isOpen) {
      document.body.style.pointerEvents = '';
    }
    
    // Always run cleanup when dialog closes
    if (!isOpen && mountedRef.current) {
      cleanupState();
    }
  }, [isOpen, cleanupState]);
  
  // Force a reflow/refresh to fix unresponsiveness after operation
  useEffect(() => {
    if (isOperationComplete && mountedRef.current) {
      // Force body style reset
      document.body.style.pointerEvents = '';
      
      // Clean up state
      cleanupState();
    }
  }, [isOperationComplete, cleanupState]);

  // Only render if open
  if (!isOpen) return null;

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        // Only allow closing if not currently processing
        if (!isDeleting && mountedRef.current) {
          // Force body style reset before closing
          document.body.style.pointerEvents = '';
          onClose();
        }
      }}
      onConfirm={handleDeleteConfirm}
      title="Delete Item"
      description="Are you sure you want to delete this item? This action may not be reversible."
      hasInterestedUsers={showInterestInfo && interestedCount > 0}
      interestCount={interestedCount}
      isLoading={isDeleting}
      isLoadingInterested={false} // We're not showing the loading state anymore
    />
  );
}
