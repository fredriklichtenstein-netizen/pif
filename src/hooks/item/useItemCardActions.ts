
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { supabase } from '@/integrations/supabase/client';

export const useItemCardActions = (id: string | number, postedById?: string) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const { session } = useGlobalAuth();
  const isOwner = session?.user?.id === postedById;

  // Now this is just a helper method that will be used by the dialog component
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

  // Simplified to show dialog immediately without blocking
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleEdit = () => {
    navigate(`/post/edit/${id}`);
  };

  const handleMessage = () => {
    if (!session) {
      return;
    }
    
    if (postedById) {
      navigate(`/conversation/new?item=${id}&user=${postedById}`);
    }
  };

  return {
    isOwner,
    showDeleteDialog,
    handleDeleteClick,
    setShowDeleteDialog,
    handleEdit,
    handleMessage,
    checkInterestedUsers // Export this function for use by the dialog
  };
};
