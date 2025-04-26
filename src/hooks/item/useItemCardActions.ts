
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { supabase } from '@/integrations/supabase/client';

export const useItemCardActions = (id: string | number, postedById?: string) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useGlobalAuth();
  const isOwner = session?.user?.id === postedById;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    setIsDeleting(true);

    try {
      // Check if anyone is interested
      const { count, error: countError } = await supabase
        .from('interests')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', numericId);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        const confirmed = confirm(`This item has ${count} interested users. They will be notified about the deletion. Are you sure you want to continue?`);
        if (!confirmed) {
          setIsDeleting(false);
          return;
        }
      }
      
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', numericId);

      if (error) throw error;

      toast({
        title: "Item deleted",
        description: "Your item has been deleted successfully",
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
    handleDelete,
    handleEdit,
    handleMessage
  };
};
