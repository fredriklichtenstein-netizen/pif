
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook to handle item deletion or archiving
 */
export function useItemDeletion(
  id: string | number,
  onClose: () => void,
  onSuccess?: () => void
) {
  const [isDeleting, setIsDeleting] = useState(false);
  const operationCompleteRef = useRef(false);
  const timeoutRefs = useRef<Array<NodeJS.Timeout>>([]);
  const { toast } = useToast();

  // Cleanup function to ensure all pending operations are properly terminated
  const cleanupState = useCallback(() => {
    // Clear all pending timeouts
    timeoutRefs.current.forEach(timeoutId => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    
    // Reset the timeout refs array
    timeoutRefs.current = [];
    
    // Reset state
    setIsDeleting(false);
  }, []);

  // Function to cleanup all realtime connections for this item
  const cleanupRealtimeConnections = useCallback(() => {
    try {
      console.log(`Starting cleanup for item ${id} realtime connections`);
      
      // Get all channels
      const allChannels = supabase.getChannels();
      
      // Find and remove channels related to this item
      const itemChannels = allChannels.filter(channel => 
        channel.topic.includes(`item-`) && channel.topic.includes(`${id}`)
      );
      
      console.log(`Found ${itemChannels.length} realtime channels to clean up for item ${id}`);
      
      if (itemChannels.length > 0) {
        itemChannels.forEach(channel => {
          try {
            supabase.removeChannel(channel);
            console.log(`Removed channel: ${channel.topic}`);
          } catch (e) {
            console.error(`Error removing channel ${channel.topic}:`, e);
          }
        });
      } else {
        console.log("No realtime channels found for cleanup");
      }
    } catch (e) {
      console.error("Error in cleanup process:", e);
    }
  }, [id]);

  const handleDeleteConfirm = async (reason: string, isSoftDelete: boolean) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    setIsDeleting(true);
    operationCompleteRef.current = false;

    try {
      // First check if we're authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('You must be signed in to perform this action.');
      }
      
      let success = false;
      
      if (isSoftDelete) {
        // Use the database function for archiving
        const { data: result, error } = await supabase.rpc(
          'archive_item',
          { 
            p_item_id: numericId,
            p_reason: reason || null
          }
        );
        
        if (error) {
          console.error('Archive error details:', error);
          throw error;
        }
        
        success = Boolean(result);
        
        if (!success) {
          throw new Error('Failed to archive item');
        }
        
        toast({
          title: "Item archived",
          description: "The item has been archived and can be restored later",
        });
      } else {
        // For permanent deletion, use the database function
        const { data: result, error: deleteError } = await supabase.rpc(
          'delete_item_with_related_records',
          { 
            p_item_id: numericId,
            p_reason: reason || null
          }
        );
        
        if (deleteError) {
          console.error('Delete error details:', deleteError);
          throw deleteError;
        }
        
        success = Boolean(result);
        
        if (!success) {
          throw new Error('Failed to delete item');
        }
        
        toast({
          title: "Item deleted",
          description: "The item has been permanently deleted",
        });
      }

      // Mark operation as complete to prevent state conflicts
      operationCompleteRef.current = true;
      
      // Important: Cleanup all realtime connections first
      cleanupRealtimeConnections();
      
      // Always reset pointer events
      document.body.style.pointerEvents = '';
      
      // Defer state changes to allow React to process events properly
      const closeTimeout = setTimeout(() => {
        // First close the dialog
        onClose();
        
        // Then after a delay, call the success callback
        const successTimeout = setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 100);
        
        timeoutRefs.current.push(successTimeout);
      }, 50);
      
      timeoutRefs.current.push(closeTimeout);
      
    } catch (error: any) {
      console.error('Error deleting/archiving item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete operation. Please try again.",
        variant: "destructive",
      });
      
      // Reset pointer events
      document.body.style.pointerEvents = '';
      
      // Even on error, ensure we close the dialog
      const errorTimeout = setTimeout(() => {
        onClose();
      }, 50);
      
      timeoutRefs.current.push(errorTimeout);
    } finally {
      // Set deleting state to false to update UI
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDeleteConfirm,
    cleanupRealtimeConnections,
    isOperationComplete: operationCompleteRef.current,
    cleanupState
  };
}
