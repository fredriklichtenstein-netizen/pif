
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

export function useItemDeletion(
  id: string | number,
  onClose: () => void,
  onSuccess?: (operationType?: 'delete' | 'archive') => void
) {
  const [isDeleting, setIsDeleting] = useState(false);
  const operationCompleteRef = useRef(false);
  const timeoutRefs = useRef<Array<NodeJS.Timeout>>([]);
  const { toast } = useToast();
  const { t } = useTranslation();

  const cleanupState = useCallback(() => {
    timeoutRefs.current.forEach(timeoutId => {
      if (timeoutId) clearTimeout(timeoutId);
    });
    timeoutRefs.current = [];
    setIsDeleting(false);
  }, []);

  const cleanupRealtimeConnections = useCallback(() => {
    try {
      const allChannels = supabase.getChannels();
      const itemChannels = allChannels.filter(channel => 
        channel.topic.includes(`item-`) && channel.topic.includes(`${id}`)
      );
      if (itemChannels.length > 0) {
        itemChannels.forEach(channel => {
          try {
            supabase.removeChannel(channel);
          } catch (e) {
            console.error(`Error removing channel ${channel.topic}:`, e);
          }
        });
      }
    } catch (e) {
      console.error("Error in cleanup process:", e);
    }
  }, [id]);

  const handleDeleteConfirm = async (reason: string, isSoftDelete: boolean) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const operationType: OperationType = isSoftDelete ? 'archive' : 'delete';
    
    setIsDeleting(true);
    operationCompleteRef.current = false;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('You must be signed in to perform this action.');
      }
      
      let success = false;
      
      if (isSoftDelete) {
        const { data: result, error } = await supabase.rpc('archive_item', { 
          p_item_id: numericId, p_reason: reason || null 
        });
        if (error) throw error;
        success = Boolean(result);
        if (!success) throw new Error('Failed to archive item');
        
        toast({
          title: t('interactions.item_archived'),
          description: t('interactions.item_archived_restore'),
        });
      } else {
        const { data: result, error: deleteError } = await supabase.rpc('delete_item_with_related_records', { 
          p_item_id: numericId, p_reason: reason || null 
        });
        if (deleteError) throw new Error(`Failed to delete item: ${deleteError.message || 'Unknown error'}`);
        success = Boolean(result);
        if (!success) throw new Error('Failed to delete item');
        
        toast({
          title: t('interactions.item_deleted'),
          description: t('interactions.item_permanently_deleted'),
        });
      }

      operationCompleteRef.current = true;
      cleanupRealtimeConnections();
      document.body.style.pointerEvents = '';
      
      const closeTimeout = setTimeout(() => {
        onClose();
        const successTimeout = setTimeout(() => {
          if (onSuccess) onSuccess(operationType);
        }, 100);
        timeoutRefs.current.push(successTimeout);
      }, 50);
      timeoutRefs.current.push(closeTimeout);
      
    } catch (error: any) {
      console.error('Error deleting/archiving item:', error);
      toast({
        title: t('interactions.error_title'),
        description: error.message || t('interactions.delete_error_description'),
        variant: "destructive",
      });
      document.body.style.pointerEvents = '';
      const errorTimeout = setTimeout(() => { onClose(); }, 50);
      timeoutRefs.current.push(errorTimeout);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDeleteConfirm,
    cleanupRealtimeConnections,
    isOperationComplete: operationCompleteRef.current,
    cleanupState
  };
}
