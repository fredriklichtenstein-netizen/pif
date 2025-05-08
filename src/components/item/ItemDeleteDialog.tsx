import { useState, useEffect } from "react";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
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
      // First check if we're authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('You must be signed in to perform this action.');
      }
      
      if (isSoftDelete) {
        // Archive the item - simple update operation
        const { error } = await supabase
          .from('items')
          .update({
            archived_at: new Date().toISOString(),
            archived_reason: reason || null
          })
          .eq('id', numericId);
          
        if (error) {
          console.error('Archive error details:', error);
          throw error;
        }
        
        // Notify interested users manually with valid notification type
        try {
          const { data: interestedUsers } = await supabase
            .from('interests')
            .select('user_id')
            .eq('item_id', numericId);
            
          if (interestedUsers && interestedUsers.length > 0) {
            const { data: item } = await supabase
              .from('items')
              .select('title')
              .eq('id', numericId)
              .single();
              
            for (const user of interestedUsers) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: user.user_id,
                  type: 'status_change', // Using a valid notification type
                  title: 'Item Archived',
                  content: item?.title 
                    ? `The item "${item.title}" has been archived${reason ? `: ${reason}` : ''}` 
                    : 'An item you were interested in has been archived',
                  reference_id: numericId.toString(),
                  reference_type: 'item'
                });
            }
          }
        } catch (notifyError) {
          console.error('Error notifying users:', notifyError);
          // Continue with success flow even if notifications fail
        }
        
        toast({
          title: "Item archived",
          description: "The item has been archived and can be restored later",
        });
      } else {
        // For permanent deletion, handle each step separately with error handling
        try {
          // First notify interested users
          const { data: interestedUsers } = await supabase
            .from('interests')
            .select('user_id')
            .eq('item_id', numericId);
            
          if (interestedUsers && interestedUsers.length > 0) {
            const { data: item } = await supabase
              .from('items')
              .select('title')
              .eq('id', numericId)
              .single();
              
            for (const user of interestedUsers) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: user.user_id,
                  type: 'status_change', // Using a valid notification type
                  title: 'Item Deleted',
                  content: item?.title 
                    ? `The item "${item.title}" has been deleted${reason ? `: ${reason}` : ''}` 
                    : 'An item you were interested in has been deleted',
                  reference_id: numericId.toString(),
                  reference_type: 'item'
                });
            }
          }
        } catch (notifyError) {
          console.error('Error notifying users:', notifyError);
          // Continue with deletion even if notification fails
        }
        
        // Delete related records one by one
        try {
          await supabase.from('bookmarks').delete().eq('item_id', numericId);
          await supabase.from('likes').delete().eq('item_id', numericId);
          await supabase.from('comments').delete().eq('item_id', numericId);
          await supabase.from('interests').delete().eq('item_id', numericId);
          await supabase.from('item_interactions').delete().eq('item_id', numericId);
          await supabase.from('item_shares').delete().eq('item_id', numericId);
        } catch (relatedError) {
          console.error('Error deleting related records:', relatedError);
          // Continue with main item deletion
        }
        
        // Finally delete the item itself
        const { error: deleteError } = await supabase
          .from('items')
          .delete()
          .eq('id', numericId);
        
        if (deleteError) {
          console.error('Delete error details:', deleteError);
          throw deleteError;
        }
        
        toast({
          title: "Item deleted",
          description: "The item has been permanently deleted",
        });
      }

      // Close the dialog first to prevent state updates on unmounted components
      onClose();

      // Call onSuccess callback immediately if provided
      if (onSuccess) {
        onSuccess();
      }
      
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
