
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export const useItemCardActions = (id: string | number, postedById?: string) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCheckingInterests, setIsCheckingInterests] = useState(false);
  const deleteActionPending = useRef(false);
  const navigate = useNavigate();
  const { session } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isOwner = session?.user?.id === postedById;

  // Helper method used by the dialog component to check interested users
  const checkInterestedUsers = async (): Promise<number> => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    setIsCheckingInterests(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { count, error } = await supabase
        .from('interests')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', numericId)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error checking interested users:', error);
        toast({
          variant: "destructive",
          title: t('interactions.error_title'),
          description: t('interactions.error_check_interested')
        });
        return 0;
      }
      return count || 0;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Interested users check timed out');
        toast({
          variant: "destructive",
          title: t('interactions.operation_timed_out'),
          description: t('interactions.check_interested_timeout')
        });
      } else {
        console.error('Error checking interested users:', error);
      }
      return 0;
    } finally {
      setIsCheckingInterests(false);
    }
  };

  // Open the consumer's local SimpleDeleteDialog. The previous global
  // dialog manager / CustomEvent fallback was abandoned architecture.
  const handleDeleteClick = useCallback(() => {
    if (deleteActionPending.current) return;

    if (!isOwner) {
      toast({
        variant: "destructive",
        title: t('interactions.permission_denied'),
        description: t('interactions.only_delete_own')
      });
      return;
    }

    deleteActionPending.current = true;
    setShowDeleteDialog(true);

    setTimeout(() => {
      deleteActionPending.current = false;
    }, 500);
  }, [isOwner, toast, t]);

  const handleEdit = () => {
    if (!isOwner) {
      toast({
        variant: "destructive",
        title: t('interactions.permission_denied'),
        description: t('interactions.only_edit_own')
      });
      return;
    }
    
    navigate(`/post/edit/${id}`);
  };

  const handleMessage = () => {
    if (!session) {
      toast({
        title: t('interactions.sign_in_required'),
        description: t('interactions.sign_in_to_message'),
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
