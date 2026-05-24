
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ItemCard } from "@/components/post/ItemCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_POSTS } from "@/data/mockPosts";
import { useDemoCompletionStore } from "@/stores/demoCompletionStore";
import { useDemoSelectionsStore } from "@/stores/demoSelectionsStore";
import { useTranslation } from "react-i18next";
import { PifferRatingDialog } from "@/components/profile/completion/PifferRatingDialog";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { readCachedItem, writeCachedItem } from "@/hooks/cache/itemCache";

type PostModalProps = {
  postId: number | string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: () => void;
};

export function PostModal({ postId, open, onOpenChange, onStatusChange }: PostModalProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markAsPiffedOpen, setMarkAsPiffedOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingContext, setRatingContext] = useState<{
    receiverName: string;
    demoRaterId?: string;
    demoRateeId?: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useGlobalAuth();

  const { markAsPiffed: demoMarkAsPiffed, getStatus } = useDemoCompletionStore();
  const { getSelectedUser } = useDemoSelectionsStore();

  const formatFromRow = (data: any) => ({
    ...data,
    postedBy: {
      id: data.user_id,
      name: data.profiles?.first_name
        ? `${data.profiles.first_name} ${data.profiles.last_name?.[0] || ""}`
        : t('common.user'),
      avatar: data.profiles?.avatar_url || "",
    },
    image: data.images?.[0] || "",
    coordinates: data.coordinates
      ? {
          lat: typeof data.coordinates === 'object' && data.coordinates !== null
            ? (data.coordinates as any).y
            : null,
          lng: typeof data.coordinates === 'object' && data.coordinates !== null
            ? (data.coordinates as any).x
            : null,
        }
      : undefined,
  });

  useEffect(() => {
    if (!open || !postId) return;

    if (DEMO_MODE) {
      setLoading(true);
      const mockPost = MOCK_POSTS.find(p => String(p.id) === String(postId));
      if (mockPost) {
        const completionStatus = getStatus(mockPost.id);
        setPost({
          ...mockPost,
          image: mockPost.images?.[0] || "",
          status: completionStatus === "pending_confirmation" ? "piffed" :
                  completionStatus === "completed" ? "completed" :
                  completionStatus === "archived" ? "archived" : "active",
        });
      }
      setLoading(false);
      return;
    }

    // Hydrate instantly from cache.
    const cached = readCachedItem(postId);
    if (cached) {
      setPost(cached.postedBy ? cached : formatFromRow(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Background refresh.
    supabase
      .from("items")
      .select("*, profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)")
      .eq("id", typeof postId === 'string' ? parseInt(postId, 10) : postId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching post:", error);
          setLoading(false);
          return;
        }
        if (data) {
          const formatted = formatFromRow(data);
          setPost(formatted);
          writeCachedItem(formatted);
        }
        setLoading(false);
      });
  }, [open, postId]);

  const handleMarkAsPiffed = async () => {
    if (!post) return;
    
    setIsUpdating(true);
    
    try {
      if (DEMO_MODE) {
        const selectedReceiverId = getSelectedUser(post.id);
        demoMarkAsPiffed(post.id, selectedReceiverId || undefined);

        toast({
          title: t('ui.done'),
          description: t('ui.pif_marked_piffed_receiver'),
        });

        setPost({ ...post, status: "piffed" });
        if (onStatusChange) onStatusChange();
        setMarkAsPiffedOpen(false);
        setIsUpdating(false);

        // Prompt the piffer to rate the selected receiver.
        if (selectedReceiverId) {
          setRatingContext({
            receiverName: t('common.user'),
            demoRaterId: post.postedBy?.id ?? user?.id ?? 'demo-piffer',
            demoRateeId: selectedReceiverId,
          });
          setRatingOpen(true);
        }
        return;
      }
      
      const { error } = await supabase
        .from("items")
        .update({ pif_status: "piffed" })
        .eq("id", post.id);
        
      if (error) throw error;
      
      const { data: interests } = await supabase
        .from("interests")
        .select("user_id, status")
        .eq("item_id", post.id)
        .neq("status", "selected");
        
      if (interests && interests.length > 0) {
        const { data: selectedInterest } = await supabase
          .from("interests")
          .select("profiles:user_id(first_name)")
          .eq("item_id", post.id)
          .eq("status", "selected")
          .single();
          
        const sel: any = selectedInterest?.profiles;
        const receiverName = sel?.first_name || (Array.isArray(sel) ? sel?.[0]?.first_name : undefined) || t('common.user');
        
        for (const interest of interests) {
          await supabase.rpc("create_notification", {
            p_user_id: interest.user_id,
            p_type: "pif_status",
            p_payload: {
              title: t('ui.pif_given_away'),
              content: t('ui.pif_given_to', { title: post.title, name: receiverName }),
              reference_id: post.id.toString(),
              reference_type: "item",
              action_url: `/feed?post=${post.id}`
            }
          });
        }
      }
      
      toast({
        title: t('ui.done'),
        description: t('ui.pif_marked_piffed'),
      });

      setPost({ ...post, status: "piffed" });

      if (onStatusChange) onStatusChange();

      setMarkAsPiffedOpen(false);

      // Prompt the piffer to rate the selected receiver. The RPC infers the
      // ratee from the 'selected' interest on this item, so no ids needed.
      const { data: selected } = await supabase
        .from("interests")
        .select("profiles:user_id(first_name)")
        .eq("item_id", post.id)
        .eq("status", "selected")
        .maybeSingle();
      if (selected) {
        setRatingContext({
          receiverName: (selected as any)?.profiles?.first_name || t('common.user'),
        });
        setRatingOpen(true);
      }

    } catch (error) {
      console.error("Error marking post as piffed:", error);
      toast({
        title: t('common.error'),
        description: t('ui.failed_mark_piffed'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>{post?.title || t('ui.loading_info')}</DialogTitle>
            <DialogDescription>{t('ui.post_details') ?? 'Post details'}</DialogDescription>
          </VisuallyHidden>
          {loading ? (
            <div className="p-8 text-center">{t('ui.loading_info')}</div>
          ) : post ? (
            <ItemCard 
              id={post.id}
              title={post.title}
              description={post.description}
              image={post.image}
              location={post.location}
              coordinates={post.coordinates}
              category={post.category}
              condition={post.condition}
              postedBy={post.postedBy}
              markAsPiffedAction={post.status !== "piffed" && post.status !== "completed" && post.status !== "archived" ? () => setMarkAsPiffedOpen(true) : undefined}
            />
          ) : (
            <div className="p-8 text-center">{t('ui.post_not_found')}</div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={markAsPiffedOpen} onOpenChange={setMarkAsPiffedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ui.mark_as_piffed_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('ui.mark_as_piffed_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkAsPiffed} 
              disabled={isUpdating}
              className="bg-primary hover:bg-primary/90"
            >
              {isUpdating ? t('common.processing') : t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {ratingContext && post && (
        <PifferRatingDialog
          open={ratingOpen}
          onOpenChange={setRatingOpen}
          itemId={post.id}
          receiverName={ratingContext.receiverName}
          demoRaterId={ratingContext.demoRaterId}
          demoRateeId={ratingContext.demoRateeId}
        />
      )}
    </>
  );
}
