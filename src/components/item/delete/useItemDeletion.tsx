
import { useState, useCallback } from "react";
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
  const { toast } = useToast();

  // Function to cleanup all realtime connections for this item
  const cleanupRealtimeConnections = useCallback(() => {
    try {
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

      // Important: Cleanup all realtime connections first
      // This is crucial to prevent the stale UI issue
      cleanupRealtimeConnections();
      
      // Close the dialog first, with a small delay to ensure
      // the dialog properly unmounts
      setTimeout(() => {
        // Now it's safe to close the dialog
        onClose();
        
        // After dialog is closed and with realtime connections cleaned up,
        // it's safe to call onSuccess after a small delay
        setTimeout(() => {
          if (onSuccess) {
            // Call onSuccess callback if provided
            onSuccess();
          }
        }, 100);
      }, 50);
      
    } catch (error: any) {
      console.error('Error deleting/archiving item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete operation. Please try again.",
        variant: "destructive",
      });
      
      // Even on error, ensure we close the dialog to prevent UI hang
      setTimeout(() => {
        onClose();
      }, 50);
    } finally {
      // Set deleting state to false to update UI
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDeleteConfirm,
    cleanupRealtimeConnections
  };
}
