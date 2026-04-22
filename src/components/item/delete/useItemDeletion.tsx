
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
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
        console.log('Attempting archive, item ID:', numericId, 'type:', typeof numericId);
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session user:', session?.user?.id);
        const { data: result, error } = await supabase.rpc('archive_item', {
          p_item_id: numericId,
          p_reason: reason || null
        });
        console.log('Archive result:', result, 'Error:', error);
        if (error) throw error;
        success = Boolean(result);
        if (!success) throw new Error('Failed to archive item');
        
        // Sonner toast with an "Undo" action that restores the item.
        sonnerToast.success(t('interactions.item_archived'), {
          description: t('interactions.item_archived_restore'),
          duration: 8000,
          action: {
            label: t('interactions.undo'),
            onClick: async () => {
              try {
                let restored = false;
                const { data: rpcResult, error: rpcError } = await (supabase as any)
                  .rpc('restore_item', { p_item_id: numericId });

                if (!rpcError) {
                  restored = Boolean(rpcResult);
                } else {
                  console.warn('restore_item RPC unavailable, falling back to direct update:', rpcError.message);
                  const { error: updateError } = await (supabase
                    .from('items')
                    .update({
                      pif_status: 'active',
                      archived_at: null,
                      archived_reason: null,
                    } as any) as any)
                    .eq('id', numericId);
                  if (updateError) throw updateError;
                  restored = true;
                }

                if (!restored) {
                  throw new Error('Restore returned no rows.');
                }

                sonnerToast.success(t('interactions.item_restored'), {
                  description: t('interactions.item_restored_description'),
                });

                // Tell any list that optimistically removed this item to add it back.
                document.dispatchEvent(
                  new CustomEvent('item-operation-undone', {
                    detail: { itemId: numericId, operationType: 'archive' },
                  })
                );
              } catch (err: any) {
                console.error('Undo archive failed:', err);
                sonnerToast.error(t('post.error'), {
                  description: err?.message || t('interactions.restore_error'),
                });
              }
            },
          },
        });
      } else {
        // Hard delete: defer the destructive RPC for 12s so the user can undo.
        const UNDO_WINDOW_MS = 12000;
        let cancelled = false;

        // Optimistically broadcast removal so the item disappears from lists immediately.
        try {
          document.dispatchEvent(
            new CustomEvent('item-operation-success', {
              detail: { itemId: numericId, operationType: 'delete' },
            })
          );
        } catch (e) {
          console.error('Failed to dispatch optimistic delete event:', e);
        }

        const toastId = sonnerToast.warning(t('interactions.item_pending_delete_title'), {
          description: t('interactions.item_pending_delete_description'),
          duration: UNDO_WINDOW_MS,
          action: {
            label: t('interactions.undo'),
            onClick: () => {
              cancelled = true;
              if (pendingDeleteTimer) clearTimeout(pendingDeleteTimer);
              // Tell lists to put the item back.
              document.dispatchEvent(
                new CustomEvent('item-operation-undone', {
                  detail: { itemId: numericId, operationType: 'delete' },
                })
              );
              sonnerToast.success(t('interactions.delete_undone_title'), {
                description: t('interactions.delete_undone_description'),
              });
            },
          },
        });

        const pendingDeleteTimer = setTimeout(async () => {
          if (cancelled) return;
          try {
            const { data: result, error: deleteError } = await supabase.rpc('delete_item_with_related_records', {
              p_item_id: numericId, p_reason: reason || null
            });
            if (deleteError) throw new Error(`Failed to delete item: ${deleteError.message || 'Unknown error'}`);
            if (!Boolean(result)) throw new Error('Failed to delete item');

            sonnerToast.success(t('interactions.item_deleted'), {
              description: t('interactions.item_permanently_deleted'),
              id: toastId,
            });
          } catch (err: any) {
            console.error('Deferred delete failed:', err);
            // Roll back optimistic removal so the item reappears.
            document.dispatchEvent(
              new CustomEvent('item-operation-undone', {
                detail: { itemId: numericId, operationType: 'delete' },
              })
            );
            sonnerToast.error(t('interactions.error_title'), {
              description: err?.message || t('interactions.delete_error_description'),
              id: toastId,
            });
          }
        }, UNDO_WINDOW_MS);
        timeoutRefs.current.push(pendingDeleteTimer);

        success = true;
      }

      operationCompleteRef.current = true;
      cleanupRealtimeConnections();
      document.body.style.pointerEvents = '';

      // Broadcast a global success event so any list (feed, archived grid, etc.)
      // can perform an instant optimistic removal without prop drilling.
      try {
        document.dispatchEvent(
          new CustomEvent("item-operation-success", {
            detail: { itemId: numericId, operationType },
          })
        );
      } catch (e) {
        console.error("Failed to dispatch item-operation-success event:", e);
      }

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
