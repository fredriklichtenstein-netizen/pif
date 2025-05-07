
import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ItemDeleteDialogProps {
  id: string | number;
  isOpen: boolean;
  onClose: () => void;
  interestedCount: number;
}

export function ItemDeleteDialog({ 
  id, 
  isOpen, 
  onClose, 
  interestedCount 
}: ItemDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
      
      toast({
        title: isSoftDelete ? "Item archived" : "Item deleted",
        description: isSoftDelete 
          ? "The item has been archived and can be restored later" 
          : "The item has been permanently deleted",
      });
      
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
      hasInterestedUsers={interestedCount > 0}
      interestCount={interestedCount}
    />
  );
}
