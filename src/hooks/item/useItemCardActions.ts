
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { supabase } from '@/integrations/supabase/client';

export const useItemCardActions = (id: string | number, postedById?: string) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useGlobalAuth();
  const isOwner = session?.user?.id === postedById;

  // Get the count of interested users for this item
  const checkInterestedUsers = async (): Promise<number> => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    try {
      const { count, error } = await supabase
        .from('interests')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', numericId);
        
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error checking interested users:', error);
      return 0;
    }
  };

  const handleDeleteClick = async () => {
    const userCount = await checkInterestedUsers();
    setInterestedCount(userCount);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteConfirm = async (reason: string, isSoftDelete: boolean) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    setIsDeleting(true);

    try {
      // Check if anyone is interested (as a safety check)
      const { count, error: countError } = await supabase
        .from('interests')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', numericId);
        
      if (countError) throw countError;
      
      // If there are interested users, notify them about deletion
      if (count && count > 0) {
        try {
          // Get item title first for the notification
          const { data: itemData } = await supabase
            .from('items')
            .select('title')
            .eq('id', numericId)
            .single();
            
          const itemTitle = itemData?.title || 'An item';
          
          // For each interested user, create a notification
          const { data: interestedUsers } = await supabase
            .from('interests')
            .select('user_id')
            .eq('item_id', numericId);
            
          if (interestedUsers && interestedUsers.length > 0) {
            for (const user of interestedUsers) {
              // Create notification for each user
              await supabase.rpc('create_notification', {
                p_user_id: user.user_id,
                p_type: isSoftDelete ? 'item_archived' : 'item_deleted',
                p_title: isSoftDelete ? 'Item Archived' : 'Item Deleted',
                p_content: reason 
                  ? `"${itemTitle}" was ${isSoftDelete ? 'archived' : 'deleted'} with reason: ${reason}` 
                  : `"${itemTitle}" was ${isSoftDelete ? 'archived' : 'deleted'} by the owner`,
                p_reference_id: numericId.toString(),
                p_reference_type: 'item'
              });
            }
          }
        } catch (notifyError) {
          console.error('Error notifying interested users:', notifyError);
          // Continue with deletion even if notification fails
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
      } else {
        // Hard delete: permanently remove
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', numericId);

        if (error) throw error;
      }

      // Return to profile or reload feed
      if (window.location.pathname.includes('/feed')) {
        window.location.reload();
      } else {
        navigate('/profile');
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
      setShowDeleteDialog(false);
    }
  };

  const handleEdit = () => {
    navigate(`/post/edit/${id}`);
  };

  const handleMessage = () => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to send messages",
        variant: "destructive",
      });
      return;
    }
    
    if (postedById) {
      navigate(`/conversation/new?item=${id}&user=${postedById}`);
    }
  };

  return {
    isDeleting,
    isOwner,
    showDeleteDialog,
    interestedCount,
    handleDeleteClick,
    handleDeleteConfirm,
    setShowDeleteDialog,
    handleEdit,
    handleMessage
  };
};
