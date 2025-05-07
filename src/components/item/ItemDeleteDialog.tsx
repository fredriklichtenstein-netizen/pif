
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

  // Helper function to delete related records for an item with proper error handling and timeouts
  const deleteRelatedRecords = async (itemId: number): Promise<void> => {
    console.log("Starting deleteRelatedRecords for item:", itemId);
    
    // Step 1: Delete bookmarks
    try {
      const { error: bookmarksError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('item_id', itemId);
      
      if (bookmarksError) {
        console.error("Error deleting bookmarks:", bookmarksError);
      } else {
        console.log("Successfully deleted bookmarks for item:", itemId);
      }
    } catch (error) {
      console.error("Exception deleting bookmarks:", error);
      // Continue with other deletions even if this one fails
    }
    
    // Step 2: Delete likes
    try {
      const { error: likesError } = await supabase
        .from('likes')
        .delete()
        .eq('item_id', itemId);
      
      if (likesError) {
        console.error("Error deleting likes:", likesError);
      } else {
        console.log("Successfully deleted likes for item:", itemId);
      }
    } catch (error) {
      console.error("Exception deleting likes:", error);
    }
    
    // Step 3: Delete interests
    try {
      const { error: interestsError } = await supabase
        .from('interests')
        .delete()
        .eq('item_id', itemId);
      
      if (interestsError) {
        console.error("Error deleting interests:", interestsError);
      } else {
        console.log("Successfully deleted interests for item:", itemId);
      }
    } catch (error) {
      console.error("Exception deleting interests:", error);
    }
    
    // Step 4: Delete comments
    try {
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('item_id', itemId);
      
      if (commentsError) {
        console.error("Error deleting comments:", commentsError);
      } else {
        console.log("Successfully deleted comments for item:", itemId);
      }
    } catch (error) {
      console.error("Exception deleting comments:", error);
    }
    
    // Step 5: Handle conversations and related records
    try {
      // Find all conversations related to this item
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('item_id', itemId);
      
      if (convError) {
        console.error('Error fetching conversations:', convError);
      } else if (conversations && conversations.length > 0) {
        console.log(`Found ${conversations.length} conversations to delete for item:`, itemId);
        // Get all conversation IDs
        const conversationIds = conversations.map(conv => conv.id);
        
        // Delete related conversation participants
        try {
          const { error: partError } = await supabase
            .from('conversation_participants')
            .delete()
            .in('conversation_id', conversationIds);
            
          if (partError) {
            console.error("Error deleting conversation participants:", partError);
          } else {
            console.log("Successfully deleted conversation participants");
          }
        } catch (error) {
          console.error("Exception deleting conversation participants:", error);
        }
        
        // Delete related messages
        try {
          const { error: msgError } = await supabase
            .from('messages')
            .delete()
            .in('conversation_id', conversationIds);
            
          if (msgError) {
            console.error("Error deleting messages:", msgError);
          } else {
            console.log("Successfully deleted messages");
          }
        } catch (error) {
          console.error("Exception deleting messages:", error);
        }
        
        // Finally delete the conversations themselves
        try {
          const { error: convDelError } = await supabase
            .from('conversations')
            .delete()
            .eq('item_id', itemId);
            
          if (convDelError) {
            console.error("Error deleting conversations:", convDelError);
          } else {
            console.log("Successfully deleted conversations");
          }
        } catch (error) {
          console.error("Exception deleting conversations:", error);
        }
      }
    } catch (error) {
      console.error('Error handling conversations deletion:', error);
    }
    
    console.log("Completed deleteRelatedRecords for item:", itemId);
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
        // Soft delete: use 'claimed' status instead of 'archived' to avoid constraint violation
        console.log("Performing soft delete (archiving) with status 'claimed'");
        operationResult = await supabase
          .from('items')
          .update({ 
            status: 'claimed', // Using 'claimed' instead of 'archived' to avoid constraint violation
            archived_reason: reason || null,
            archived_at: new Date().toISOString() // This timestamp indicates it's archived
          })
          .eq('id', numericId);
      } else {
        // For hard delete, we need to first delete related records
        console.log("Performing hard delete - first removing related records");
        await deleteRelatedRecords(numericId);
        
        // Then delete the item itself
        console.log("Now deleting the main item record");
        operationResult = await supabase
          .from('items')
          .delete()
          .eq('id', numericId);
      }
      
      // Check for operation errors
      if (operationResult.error) {
        console.error("Operation result error:", operationResult.error);
        
        if (operationResult.error.code === '23503') {
          // Foreign key constraint violation
          throw new Error("This item has related records that prevent deletion. Please try archiving instead.");
        } else if (operationResult.error.code === '23514') {
          // Check constraint violation
          throw new Error("Unable to archive item due to status constraints. Please try deleting instead.");
        } else {
          throw operationResult.error;
        }
      }
      
      // Send notifications in the background if there are any
      if (notificationPromises.length > 0) {
        console.log("Sending notifications to interested users");
        Promise.all(notificationPromises)
          .then(() => console.log("All notifications sent successfully"))
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
