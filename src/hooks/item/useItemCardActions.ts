
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useItemCardActions = (id: string | number, postedById?: string) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCheckingInterests, setIsCheckingInterests] = useState(false);
  const navigate = useNavigate();
  const { session } = useGlobalAuth();
  const { toast } = useToast();
  const isOwner = session?.user?.id === postedById;

  // Helper method used by the dialog component to check interested users
  const checkInterestedUsers = async (): Promise<number> => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    setIsCheckingInterests(true);
    
    try {
      const { count, error } = await supabase
        .from('interests')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', numericId);
        
      if (error) {
        console.error('Error checking interested users:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check interested users. Proceeding anyway."
        });
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error checking interested users:', error);
      return 0;
    } finally {
      setIsCheckingInterests(false);
    }
  };

  // Show dialog immediately without blocking
  const handleDeleteClick = () => {
    if (!isOwner) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You can only delete your own items"
      });
      return;
    }
    
    setShowDeleteDialog(true);
  };

  const handleEdit = () => {
    if (!isOwner) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You can only edit your own items"
      });
      return;
    }
    
    navigate(`/post/edit/${id}`);
  };

  const handleMessage = () => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to send messages",
        variant: "destructive"
      });
      return;
    }
    
    if (postedById) {
      navigate(`/conversation/new?item=${id}&user=${postedById}`);
    }
  };

  return {
    isOwner,
    showDeleteDialog,
    isCheckingInterests,
    handleDeleteClick,
    setShowDeleteDialog,
    handleEdit,
    handleMessage,
    checkInterestedUsers 
  };
};
