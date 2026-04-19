/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { supabase } from "@/integrations/supabase/client";
import { parseCoordinatesFromDB } from "@/types/post";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { ItemCard } from "@/components/item/ItemCard";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/utils/formatDate";

const FADE_DURATION_MS = 320;

export function ArchivedPifsGrid({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  // Items currently animating out (still rendered, with fade-out class).
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  // Items fully removed (no longer rendered).
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const fadeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isOwner = user && user.id === userId;

  const fetchArchivedItems = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("items")
        .select("*, profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)") as any)
        .eq("user_id", userId)
        .eq("pif_status", "archived")
        .order("archived_at", { ascending: false });
        
      if (error) throw error;
      
      const transformedData = data?.map(item => {
        let coordinates;
        if (item.coordinates) {
          try {
            coordinates = parseCoordinatesFromDB(String(item.coordinates));
          } catch (err) {
            console.error("Failed to parse coordinates:", err);
          }
        }
        
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          images: item.images || [],
          location: item.location,
          coordinates: coordinates,
          category: item.category,
          condition: item.condition,
          measurements: item.measurements || {},
          archived_at: item.archived_at,
          archived_reason: item.archived_reason,
          postedBy: {
            id: item.user_id,
            name: item.profiles ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() : 'Unknown User',
            avatar: item.profiles?.avatar_url || ''
          }
        };
      }) || [];
      
      setItems(transformedData);
    } catch (err) {
      console.error("Error fetching archived items:", err);
      toast({
        title: t('post.error'),
        description: t('interactions.error_load_archived'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedItems();
  }, [userId]);

  // Listen for global delete success events so deleted items animate out, then disappear.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ itemId: string | number; operationType: string }>).detail;
      if (!detail || detail.operationType !== 'delete') return;
      const idStr = String(detail.itemId);

      setFadingIds(prev => {
        if (prev.has(idStr)) return prev;
        const next = new Set(prev);
        next.add(idStr);
        return next;
      });

      const existing = fadeTimersRef.current.get(idStr);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        setDeletedIds(prev => {
          const next = new Set(prev);
          next.add(idStr);
          return next;
        });
        setFadingIds(prev => {
          if (!prev.has(idStr)) return prev;
          const next = new Set(prev);
          next.delete(idStr);
          return next;
        });
        fadeTimersRef.current.delete(idStr);
      }, FADE_DURATION_MS);

      fadeTimersRef.current.set(idStr, timer);
    };
    document.addEventListener('item-operation-success', handler as EventListener);
    return () => {
      document.removeEventListener('item-operation-success', handler as EventListener);
      fadeTimersRef.current.forEach(t => clearTimeout(t));
      fadeTimersRef.current.clear();
    };
  }, []);

  const visibleItems = items.filter(item => !deletedIds.has(String(item.id)));

  const handleRestore = async (itemId: number) => {
    if (!isOwner) return;

    setRestoring(itemId);
    try {
      // Prefer the SECURITY DEFINER RPC (bypasses missing UPDATE RLS policy on items).
      // Falls back to a direct UPDATE for environments where the RPC isn't deployed yet.
      let restored = false;
      const { data: rpcResult, error: rpcError } = await (supabase as any)
        .rpc('restore_item', { p_item_id: itemId });

      if (!rpcError) {
        restored = Boolean(rpcResult);
      } else {
        console.warn('restore_item RPC unavailable, falling back to direct update:', rpcError.message);
        const { error: updateError, count } = await (supabase
          .from('items')
          .update({
            pif_status: null,
            archived_at: null,
            archived_reason: null,
          } as any, { count: 'exact' }) as any)
          .eq('id', itemId);

        if (updateError) throw updateError;
        restored = (count ?? 0) > 0;
      }

      if (!restored) {
        throw new Error('Restore returned no rows — RLS or RPC permissions may be missing.');
      }

      toast({
        title: t('interactions.item_restored'),
        description: t('interactions.item_restored_description'),
      });

      // Fade the restored item out, then remove from the local list.
      const idStr = String(itemId);
      setFadingIds(prev => {
        if (prev.has(idStr)) return prev;
        const next = new Set(prev);
        next.add(idStr);
        return next;
      });
      const existing = fadeTimersRef.current.get(idStr);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setItems(prev => prev.filter(item => item.id !== itemId));
        setFadingIds(prev => {
          if (!prev.has(idStr)) return prev;
          const next = new Set(prev);
          next.delete(idStr);
          return next;
        });
        fadeTimersRef.current.delete(idStr);
      }, FADE_DURATION_MS);
      fadeTimersRef.current.set(idStr, timer);
    } catch (err: any) {
      console.error("Error restoring item:", err);
      toast({
        title: t('post.error'),
        description: err?.message || t('interactions.restore_error'),
        variant: "destructive"
      });
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        {t('interactions.loading_archived')}
      </div>
    );
  }

  if (visibleItems.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg font-semibold mb-2">{t('interactions.no_archived')}</p>
        <p className="text-muted-foreground">{t('interactions.no_archived_description')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {visibleItems.map(item => {
        const isFading = fadingIds.has(String(item.id));
        return (
          <div
            key={item.id}
            className={`relative${isFading ? ' animate-fade-out-collapse pointer-events-none' : ''}`}
            aria-hidden={isFading || undefined}
          >
            <div className="relative overflow-hidden rounded-lg">
              <ItemCard {...item} />
              {/* Muted overlay so archived items look visually distinct from active pifs. */}
              <div className="pointer-events-none absolute inset-0 bg-background/40" aria-hidden="true" />
              {/* Archived badge sits above the overlay, top-left. */}
              <Badge
                variant="secondary"
                className="absolute top-3 left-3 z-10 flex items-center gap-1 shadow-md"
              >
                <Archive className="h-3 w-3" />
                {t('interactions.archived')}
              </Badge>
            </div>

          {isOwner && (
            <div className="absolute top-3 right-3 z-10">
              <Button
                variant="default"
                size="sm"
                className="shadow-lg flex items-center gap-1 font-medium"
                onClick={() => handleRestore(item.id)}
                disabled={restoring === item.id}
              >
                {restoring === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArchiveRestore className="h-4 w-4" />
                )}
                {t('interactions.restore')}
              </Button>
            </div>
          )}

          {(item.archived_reason || item.archived_at) && (
            <div className="mt-1.5 px-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Archive className="h-3 w-3 mt-0.5 shrink-0 opacity-70" aria-hidden="true" />
              <span className="leading-snug">
                {item.archived_at && (
                  <span className="font-medium">
                    {t('interactions.archived_time_ago', {
                      time: formatRelativeTime(new Date(item.archived_at)),
                    })}
                  </span>
                )}
                {item.archived_reason && (
                  <>
                    {item.archived_at && <span> · </span>}
                    <span className="italic">{item.archived_reason}</span>
                  </>
                )}
              </span>
            </div>
          )}
          </div>
        );
      })}
    </div>
  );
}
