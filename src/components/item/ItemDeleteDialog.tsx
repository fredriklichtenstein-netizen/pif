
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

  // Helper function to delete related records for an item
  const deleteRelatedRecords = async (itemId: number): Promise<void> => {
    // Create an array of promises to delete related records in parallel
    const deletePromises = [
      // Delete bookmarks first
      supabase.from('bookmarks').delete().eq('item_id', itemId),
      // Delete likes
      supabase.from('likes').delete().eq('item_id', itemId),
      // Delete interests
      supabase.from('interests').delete().eq('item_id', itemId),
      // Delete comments
      supabase.from('comments').delete().eq('item_id', itemId),
    ];
    
    try {
      // Execute all delete operations in parallel
      const results = await Promise.all(deletePromises);
      
      // Check for errors
      results.forEach((result, index) => {
        if (result.error) {
          console.error(`Error deleting related records (${index}):`, result.error);
        }
      });
      
      // Handle conversations separately as they need special treatment
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', itemId);
      
      if (convError) {
        console.error('Error fetching conversations:', convError);
      } else if (conversations && conversations.length > 0) {
        // Get all conversation IDs
        const conversationIds = conversations.map(conv => conv.id);
        
        // Delete related conversation participants and messages
        await Promise.all([
          supabase.from('conversation_participants')
            .delete()
            .in('conversation_id', conversationIds),
          supabase.from('messages')
            .delete()
            .in('conversation_id', conversationIds),
        ]);
        
        // Then delete the conversations themselves
        await supabase.from('conversations')
          .delete()
          .eq('item_id', itemId);
      }
    } catch (error) {
      console.error('Error in deleteRelatedRecords:', error);
      throw error;
    }
  };
  
  const handleDeleteConfirm = async (reason: string, isSoftDelete: boolean) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    setIsDeleting(true);

    try {
      // We already have the interested count from the fetch earlier
      
      let notificationPromises: Promise<any>[] = [];
      
      // If there are interested users, prepare notifications
      if (interestedCount > 0) {
        try {
          // Get item title first for the notification
          const itemResponse = await supabase
            .from('items')
            .select('title')
            .eq('id', numericId)
            .single();
            
          const itemTitle = itemResponse?.data?.title || 'An item';
          
          // Get all interested users
          const interestedUsersResponse = await supabase
            .from('interests')
            .select('user_id')
            .eq('item_id', numericId);
            
          const interestedUsers = interestedUsersResponse?.data || [];
          
          if (interestedUsers && interestedUsers.length > 0) {
            // Create notification promises for each user, ensuring they are proper Promise objects
            notificationPromises = interestedUsers.map(user => {
              // Convert the PromiseLike to a full Promise with .then()
              return Promise.resolve(supabase.rpc('create_notification', {
                p_user_id: user.user_id,
                p_type: isSoftDelete ? 'item_archived' : 'item_deleted',
                p_title: isSoftDelete ? 'Item Archived' : 'Item Deleted',
                p_content: reason 
                  ? `"${itemTitle}" was ${isSoftDelete ? 'archived' : 'deleted'} with reason: ${reason}` 
                  : `"${itemTitle}" was ${isSoftDelete ? 'archived' : 'deleted'} by the owner`,
                p_reference_id: numericId.toString(),
                p_reference_type: 'item'
              }));
            });
          }
        } catch (notifyError) {
          console.error('Error preparing notifications:', notifyError);
          // Continue with deletion even if notification prep fails
        }
      }
      
      let operationResult;
      
      if (isSoftDelete) {
        // Soft delete: update status to 'archived'
        operationResult = await supabase
          .from('items')
          .update({ 
            status: 'archived',
            archived_reason: reason || null,
            archived_at: new Date().toISOString()
          })
          .eq('id', numericId);
      } else {
        // For hard delete, we need to first delete related records
        await deleteRelatedRecords(numericId);
        
        // Then delete the item itself
        operationResult = await supabase
          .from('items')
          .delete()
          .eq('id', numericId);
      }
      
      // Check for operation errors
      if (operationResult.error) {
        if (operationResult.error.code === '23503') {
          // Foreign key constraint violation
          throw new Error("This item has related records that prevent deletion. Please try archiving instead.");
        } else {
          throw operationResult.error;
        }
      }
      
      // Send notifications in the background if there are any
      if (notificationPromises.length > 0) {
        Promise.all(notificationPromises)
          .catch(err => console.error('Error sending notifications:', err));
      }
      
      toast({
        title: isSoftDelete ? "Item archived" : "Item deleted",
        description: isSoftDelete 
          ? "The item has been archived and can be restored later" 
          : "The item has been permanently deleted",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior - return to profile or reload feed
        if (window.location.pathname.includes('/feed')) {
          // Instead of full page reload, redirect to ensure clean state
          navigate('/feed', { replace: true });
        } else {
          navigate('/profile');
        }
      }
      
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Always clean up state and close dialog, even on error
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        // Only allow closing if not currently processing
        if (!isDeleting) onClose();
      }}
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
