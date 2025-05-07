
import { useState, useEffect } from "react";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ItemDeleteDialogProps {
  id: string | number;
  isOpen: boolean;
  onClose: () => void;
  checkInterestedUsers?: () => Promise<number>;
  onSuccess?: () => void;
}

export function ItemDeleteDialog({ 
  id, 
  isOpen, 
  onClose,
  checkInterestedUsers,
  onSuccess
}: ItemDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [countError, setCountError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch interested count when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchInterestedCount();
    }
    
    // Cleanup function to prevent memory leaks and stale state
    return () => {
      setIsLoadingCount(false);
      setInterestedCount(0);
      setCountError(null);
    };
  }, [isOpen]);
  
  // Function to fetch interested count
  const fetchInterestedCount = async () => {
    if (!isOpen) return;
    
    setIsLoadingCount(true);
    setCountError(null);
    
    try {
      if (checkInterestedUsers) {
        // Use the passed function if available
        const count = await checkInterestedUsers();
        if (!isOpen) return; // Check if component is still mounted
        setInterestedCount(count);
      } else {
        // Otherwise do the direct DB query
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        const { count, error } = await supabase
          .from('interests')
          .select('*', { count: 'exact', head: true })
          .eq('item_id', numericId);
          
        if (error) throw error;
        if (!isOpen) return; // Check if component is still mounted
        setInterestedCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching interested count:', error);
      if (!isOpen) return; // Check if component is still mounted
      setCountError(error as Error);
      // Set to 0 in case of error, to be safe
      setInterestedCount(0);
    } finally {
      if (isOpen) { // Only update state if still mounted
        setIsLoadingCount(false);
      }
    }
  };
  
  const handleDeleteConfirm = async (reason: string, isSoftDelete: boolean) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    setIsDeleting(true);

    try {
      // We already have the interested count from the fetch earlier
      
      // If there are interested users, create notifications in batch
      if (interestedCount > 0) {
        try {
          // Get item title first for the notification
          const { data: itemData } = await supabase
            .from('items')
            .select('title')
            .eq('id', numericId)
            .single();
            
          const itemTitle = itemData?.title || 'An item';
          
          // Get all interested users
          const { data: interestedUsers } = await supabase
            .from('interests')
            .select('user_id')
            .eq('item_id', numericId);
            
          if (interestedUsers && interestedUsers.length > 0) {
            // Create notification for each user (non-blocking)
            interestedUsers.forEach(user => {
              supabase.rpc('create_notification', {
                p_user_id: user.user_id,
                p_type: isSoftDelete ? 'item_archived' : 'item_deleted',
                p_title: isSoftDelete ? 'Item Archived' : 'Item Deleted',
                p_content: reason 
                  ? `"${itemTitle}" was ${isSoftDelete ? 'archived' : 'deleted'} with reason: ${reason}` 
                  : `"${itemTitle}" was ${isSoftDelete ? 'archived' : 'deleted'} by the owner`,
                p_reference_id: numericId.toString(),
                p_reference_type: 'item'
              }).then(() => console.log(`Notification sent to user ${user.user_id}`))
                .catch(err => console.error('Error sending notification:', err));
            });
          }
        } catch (notifyError) {
          console.error('Error preparing notifications:', notifyError);
          // Continue with deletion even if notification prep fails
        }
      }
      
      // Perform soft or permanent delete
      if (isSoftDelete) {
        // Soft delete: update status to 'archived'
        const { error } = await supabase
          .from('items')
          .update({ 
            status: 'archived',
            archived_reason: reason || null,
            archived_at: new Date().toISOString()
          })
          .eq('id', numericId);

        if (error) throw error;
        
        toast({
          title: "Item archived",
          description: "The item has been archived and can be restored later",
        });
      } else {
        // Hard delete: permanently remove
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', numericId);

        if (error) throw error;
        
        toast({
          title: "Item deleted",
          description: "The item has been permanently deleted",
        });
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior - return to profile or reload feed
        if (window.location.pathname.includes('/feed')) {
          window.location.reload();
        } else {
          navigate('/profile');
        }
      }
      
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDeleteConfirm}
      title="Delete Item"
      description="Are you sure you want to delete this item? This action may not be reversible."
      hasInterestedUsers={isLoadingCount ? false : interestedCount > 0}
      interestCount={isLoadingCount ? 0 : interestedCount}
      isLoading={isDeleting}
      isLoadingInterested={isLoadingCount}
    />
  );
}
