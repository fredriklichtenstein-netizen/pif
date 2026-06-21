
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
import { extractCoordinates } from "@/utils/coordinates/coordinateExtractor";
import { usePifCompletion } from "@/hooks/usePifCompletion";

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
  // Receiver + conversation are resolved lazily once the post is loaded so we
  // can route "Markera som uppfylld" through the shared confirm_pif_handoff
  // flow used by the messaging UI (single source of truth).
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // Tracks that the current user just clicked "Markera som uppfylld" so we
  // know to open the rating dialog the moment pif_status flips to
  // 'completed' (either synchronously, when the receiver had already
  // confirmed, or via realtime when they confirm afterwards).
  const [awaitingCompletion, setAwaitingCompletion] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useGlobalAuth();

  const { markAsPiffed: demoMarkAsPiffed, getStatus } = useDemoCompletionStore();
  const { getSelectedUser } = useDemoSelectionsStore();

  const completion = usePifCompletion(
    conversationId,
    post?.id ?? null,
    user?.id ?? null,
    receiverId,
  );

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
    coordinates: extractCoordinates(data.coordinates),
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

  // Resolve the selected receiver + conversation for this item so we can
  // hook into the messaging-side completion flow. Real-mode only.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (!open || !post?.id || !user?.id) return;
    if (post.user_id && post.user_id !== user.id) return; // viewer is not the piffer
    let cancelled = false;
    (async () => {
      const { data: selectedInterest } = await (supabase
        .from("interests") as any)
        .select("user_id, profiles:user_id(first_name)")
        .eq("item_id", post.id)
        .eq("status", "selected")
        .maybeSingle();
      if (cancelled) return;
      const selUserId: string | null = selectedInterest?.user_id ?? null;
      const selName: string | null =
        (selectedInterest as any)?.profiles?.first_name ?? null;
      setReceiverId(selUserId);
      setReceiverName(selName);
      if (!selUserId) {
        setConversationId(null);
        return;
      }
      const { data: conv } = await (supabase
        .from("conversations") as any)
        .select("id")
        .eq("item_id", post.id)
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${selUserId}),and(user1_id.eq.${selUserId},user2_id.eq.${user.id})`
        )
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setConversationId(conv?.id ?? null);
    })();
    return () => { cancelled = true; };
  }, [open, post?.id, post?.user_id, user?.id]);

  // Once both parties have confirmed (pif_status === 'completed'), open the
  // rating dialog — but only for the click that just initiated this flow.
  useEffect(() => {
    if (!awaitingCompletion) return;
    if (completion.pifStatus !== "completed") return;
    setAwaitingCompletion(false);
    setRatingContext({ receiverName: receiverName || t('common.user') });
    setRatingOpen(true);
    setPost((prev: any) => (prev ? { ...prev, status: "completed" } : prev));
    if (onStatusChange) onStatusChange();
  }, [awaitingCompletion, completion.pifStatus, receiverName, onStatusChange, t]);

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

      // Real mode — reuse the same handoff RPC the messaging banner uses.
      const result = await completion.confirmHandoff("piffer");
      if (!result.ok) {
        toast({
          title: t('common.error'),
          description: t('ui.failed_mark_piffed'),
          variant: "destructive",
        });
        return;
      }

      setPost((prev: any) => (prev ? { ...prev, status: "piffed" } : prev));
      if (onStatusChange) onStatusChange();
      setMarkAsPiffedOpen(false);

      // If the receiver had already confirmed receipt, the RPC will have
      // flipped pif_status to 'completed' synchronously and the effect
      // above will open the rating dialog. Otherwise, surface a "waiting"
      // toast that mirrors the messaging-side system message.
      if (completion.receiverConfirmed) {
        setAwaitingCompletion(true);
      } else {
        setAwaitingCompletion(true);
        toast({
          title: t('ui.done'),
          description:
            "Du har bekräftat överlämning. Väntar på att mottagaren bekräftar mottagning.",
        });
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

  // In real mode, only the piffer who has not yet confirmed should see the
  // CTA — the messaging banner takes over once they have, and the rating
  // dialog opens automatically when the receiver also confirms.
  const showMarkAsPiffedCta = (() => {
    if (DEMO_MODE) {
      return post && post.status !== "piffed" && post.status !== "completed" && post.status !== "archived";
    }
    if (!post) return false;
    if (post.user_id && user?.id && post.user_id !== user.id) return false;
    if (post.status === "completed" || post.status === "archived") return false;
    if (completion.pifferConfirmed) return false;
    return true;
  })();

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
              markAsPiffedAction={showMarkAsPiffedCta ? () => setMarkAsPiffedOpen(true) : undefined}
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
