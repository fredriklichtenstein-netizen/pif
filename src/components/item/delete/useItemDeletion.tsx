
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  // Function to cleanup all realtime connections for this item
  const cleanupRealtimeConnections = () => {
    try {
      // Get all channels
      const allChannels = supabase.getChannels();
      
      // Find and remove channels related to this item
      const itemChannels = allChannels.filter(channel => 
        channel.topic.includes(`item-`) && channel.topic.includes(`${id}`)
      );
      
      console.log(`Found ${itemChannels.length} realtime channels to clean up for item ${id}`);
      
      itemChannels.forEach(channel => {
        try {
          supabase.removeChannel(channel);
          console.log(`Removed channel: ${channel.topic}`);
        } catch (e) {
          console.error(`Error removing channel ${channel.topic}:`, e);
        }
      });
    } catch (e) {
      console.error("Error in cleanup process:", e);
    }
  };

  const handleDeleteConfirm = async (reason: string, isSoftDelete: boolean) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    setIsDeleting(true);

    try {
      // First check if we're authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('You must be signed in to perform this action.');
      }
      
      if (isSoftDelete) {
        // Use the database function for archiving
        const { data: success, error } = await supabase.rpc(
          'archive_item',
          { 
            p_item_id: numericId,
            p_reason: reason || null
          }
        );
        
        if (error || !success) {
          console.error('Archive error details:', error);
          throw error || new Error('Failed to archive item');
        }
        
        toast({
          title: "Item archived",
          description: "The item has been archived and can be restored later",
        });
      } else {
        // For permanent deletion, use the database function
        const { data: success, error: deleteError } = await supabase.rpc(
          'delete_item_with_related_records',
          { 
            p_item_id: numericId,
            p_reason: reason || null
          }
        );
        
        if (deleteError || !success) {
          console.error('Delete error details:', deleteError);
          throw deleteError || new Error('Failed to delete item');
        }
        
        toast({
          title: "Item deleted",
          description: "The item has been permanently deleted",
        });
      }

      // Cleanup all realtime connections for this item
      cleanupRealtimeConnections();
      
      // Close the dialog first to prevent state updates on unmounted components
      onClose();

      // Force a complete refresh after a small delay to ensure state is updated
      setTimeout(() => {
        if (onSuccess) {
          // Call onSuccess callback if provided
          onSuccess();
        }
        
        // For permanent deletion, force a navigation refresh
        if (!isSoftDelete) {
          // Add timestamp to prevent caching
          navigate(`/feed?t=${Date.now()}`, { replace: true });
        }
      }, 300);
      
    } catch (error: any) {
      console.error('Error deleting/archiving item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete operation. Please try again.",
        variant: "destructive",
      });
      
      // Close the dialog even on error to avoid stuck UI
      onClose();
    } finally {
      // Always clean up state
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDeleteConfirm
  };
}
