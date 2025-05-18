
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { OperationType } from '@/hooks/feed/useOptimisticFeedUpdates';

interface UseItemOperationsProps {
  onSuccess?: (operationType?: OperationType) => void;
}

export function useItemOperations({ onSuccess }: UseItemOperationsProps = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkInterestedCount = useCallback(async (itemId: string | number): Promise<number> => {
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      
      const { count, error } = await supabase
        .from('interests')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', numericId);
        
      if (error) {
        console.error('Error checking interests:', error);
        throw error;
      }
      
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
      
      console.log(`Archiving item ${numericId} with reason: ${reason || 'none provided'}`);
      
      const { data: result, error } = await supabase.rpc(
        'archive_item',
        { 
          p_item_id: numericId,
          p_reason: reason || null
        }
      );
      
      if (error) {
        console.error('Error archiving item:', error);
        setError(`Failed to archive: ${error.message}`);
        toast({
          title: "Failed to archive",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      if (!result) {
        const errorMsg = "Archive operation failed";
        setError(errorMsg);
        toast({
          title: "Failed to archive",
          description: errorMsg,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Item archived",
        description: "The item has been archived successfully",
      });
      
      if (onSuccess) onSuccess('archive');
      return true;
      
    } catch (err: any) {
      console.error('Error in archive operation:', err);
      const errorMsg = err.message || "Failed to archive item";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, onSuccess]);
  
  const deleteItem = useCallback(async (itemId: string | number, reason?: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      
      console.log(`Permanently deleting item ${numericId} with reason: ${reason || 'none provided'}`);
      
      const { data: result, error } = await supabase.rpc(
        'delete_item_with_related_records',
        { 
          p_item_id: numericId,
          p_reason: reason || null
        }
      );
      
      if (error) {
        console.error('Error deleting item:', error);
        setError(`Failed to delete: ${error.message}`);
        toast({
          title: "Failed to delete",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      if (!result) {
        const errorMsg = "Delete operation failed";
        setError(errorMsg);
        toast({
          title: "Failed to delete",
          description: errorMsg,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Item deleted",
        description: "The item has been permanently deleted",
      });
      
      if (onSuccess) onSuccess('delete');
      return true;
      
    } catch (err: any) {
      console.error('Error in delete operation:', err);
      const errorMsg = err.message || "Failed to delete item";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, onSuccess]);
  
  const restoreItem = useCallback(async (itemId: string | number): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      
      console.log(`Restoring archived item ${numericId}`);
      
      // Direct update to unset the archived fields
      const { error } = await supabase
        .from('items')
        .update({ 
          archived_at: null,
          archived_reason: null
        })
        .eq('id', numericId);
      
      if (error) {
        console.error('Error restoring item:', error);
        setError(`Failed to restore: ${error.message}`);
        toast({
          title: "Failed to restore",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }
      
      toast({
        title: "Item restored",
        description: "The item has been restored successfully",
      });
      
      if (onSuccess) onSuccess('restore');
      return true;
      
    } catch (err: any) {
      console.error('Error in restore operation:', err);
      const errorMsg = err.message || "Failed to restore item";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast, onSuccess]);

  return {
    isProcessing,
    error,
    checkInterestedCount,
    archiveItem,
    deleteItem,
    restoreItem
  };
}
