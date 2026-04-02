
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { OperationType } from '@/hooks/feed/useOptimisticFeedUpdates';
import { useTranslation } from 'react-i18next';

interface UseItemOperationsProps {
  onSuccess?: (operationType?: OperationType) => void;
}

export function useItemOperations({ onSuccess }: UseItemOperationsProps = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const checkInterestedCount = useCallback(async (itemId: string | number): Promise<number> => {
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      const { count, error } = await supabase.from('interests').select('*', { count: 'exact', head: true }).eq('item_id', numericId);
      if (error) { console.error('Error checking interests:', error); throw error; }
      return count || 0;
    } catch (err: any) {
      console.error('Failed to check interested users count:', err);
      throw new Error('Failed to check interested users');
    }
  }, []);

  const archiveItem = useCallback(async (itemId: string | number, reason?: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      const { data: result, error } = await supabase.rpc('archive_item', { p_item_id: numericId, p_reason: reason || null });
      if (error) {
        console.error('Error archiving item:', error);
        setError(`Failed to archive: ${error.message}`);
        toast({ title: t('interactions.failed_archive'), description: error.message, variant: "destructive" });
        return false;
      }
      if (!result) {
        const errorMsg = t('interactions.archive_failed');
        setError(errorMsg);
        toast({ title: t('interactions.failed_archive'), description: errorMsg, variant: "destructive" });
        return false;
      }
      toast({ title: t('interactions.item_archived'), description: t('interactions.item_archived_description') });
      if (onSuccess) onSuccess('archive');
      return true;
    } catch (err: any) {
      console.error('Error in archive operation:', err);
      const errorMsg = err.message || t('interactions.archive_failed');
      setError(errorMsg);
      toast({ title: t('interactions.error_title'), description: errorMsg, variant: "destructive" });
      return false;
    } finally { setIsProcessing(false); }
  }, [toast, onSuccess, t]);
  
  const deleteItem = useCallback(async (itemId: string | number, reason?: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      const { data: result, error } = await supabase.rpc('delete_item_with_related_records', { p_item_id: numericId, p_reason: reason || null });
      if (error) {
        console.error('Error deleting item:', error);
        setError(`Failed to delete: ${error.message}`);
        toast({ title: t('interactions.failed_delete'), description: error.message, variant: "destructive" });
        return false;
      }
      if (!result) {
        const errorMsg = t('interactions.delete_failed');
        setError(errorMsg);
        toast({ title: t('interactions.failed_delete'), description: errorMsg, variant: "destructive" });
        return false;
      }
      toast({ title: t('interactions.item_deleted'), description: t('interactions.item_deleted_description') });
      if (onSuccess) onSuccess('delete');
      return true;
    } catch (err: any) {
      console.error('Error in delete operation:', err);
      const errorMsg = err.message || t('interactions.delete_failed');
      setError(errorMsg);
      toast({ title: t('interactions.error_title'), description: errorMsg, variant: "destructive" });
      return false;
    } finally { setIsProcessing(false); }
  }, [toast, onSuccess, t]);
  
  const restoreItem = useCallback(async (itemId: string | number): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      const { error } = await supabase.from('items').update({ archived_at: null, archived_reason: null }).eq('id', numericId);
      if (error) {
        console.error('Error restoring item:', error);
        setError(`Failed to restore: ${error.message}`);
        toast({ title: t('interactions.failed_restore'), description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: t('interactions.item_restored_op'), description: t('interactions.item_restored_op_description') });
      if (onSuccess) onSuccess('restore');
      return true;
    } catch (err: any) {
      console.error('Error in restore operation:', err);
      const errorMsg = err.message || t('interactions.failed_restore');
      setError(errorMsg);
      toast({ title: t('interactions.error_title'), description: errorMsg, variant: "destructive" });
      return false;
    } finally { setIsProcessing(false); }
  }, [toast, onSuccess, t]);

  return { isProcessing, error, checkInterestedCount, archiveItem, deleteItem, restoreItem };
}
