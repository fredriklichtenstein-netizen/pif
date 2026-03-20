
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ItemCard } from "@/components/post/ItemCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_POSTS } from "@/data/mockPosts";
import { useDemoCompletionStore } from "@/stores/demoCompletionStore";
import { useDemoSelectionsStore } from "@/stores/demoSelectionsStore";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  const { markAsPiffed: demoMarkAsPiffed, getStatus } = useDemoCompletionStore();
  const { getSelectedUser } = useDemoSelectionsStore();

  useEffect(() => {
    if (open && postId) {
      setLoading(true);
      
      // Demo mode: find post in mock data
      if (DEMO_MODE) {
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
      
      supabase
        .from("items")
        .select("*, profiles!items_user_id_fkey(*)")
        .eq("id", typeof postId === 'string' ? parseInt(postId, 10) : postId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching post:", error);
            return;
          }
          if (data) {
            const formattedPost = {
              ...data,
              postedBy: {
                id: data.user_id,
                name: data.profiles?.first_name 
                  ? `${data.profiles.first_name} ${data.profiles.last_name?.[0] || ""}`
                  : "User",
                avatar: data.profiles?.avatar_url || "",
              },
              image: data.images?.[0] || "",
              coordinates: data.coordinates 
                ? { 
                    lat: typeof data.coordinates === 'object' && data.coordinates !== null ? 
                         (data.coordinates as any).y : null,
                    lng: typeof data.coordinates === 'object' && data.coordinates !== null ? 
                         (data.coordinates as any).x : null 
                  } 
                : undefined,
            };
            setPost(formattedPost);
          }
          setLoading(false);
        });
    }
  }, [open, postId]);

  const handleMarkAsPiffed = async () => {
    if (!post) return;
    
    setIsUpdating(true);
    
    try {
      // Demo mode: update in local store
      if (DEMO_MODE) {
        const selectedReceiverId = getSelectedUser(post.id);
        demoMarkAsPiffed(post.id, selectedReceiverId || undefined);
        
        toast({
          title: "Klart!",
          description: "Piffen har markerats som piffad. Mottagaren kan nu bekräfta.",
        });
        
        setPost({ ...post, status: "piffed" });
        if (onStatusChange) onStatusChange();
        setMarkAsPiffedOpen(false);
        setIsUpdating(false);
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
          .select("users:profiles!interests_user_id_fkey(first_name)")
          .eq("item_id", post.id)
          .eq("status", "selected")
          .single();
          
        const receiverName = selectedInterest?.users?.first_name || "Någon";
        
        for (const interest of interests) {
          await supabase.rpc("create_notification", {
            p_user_id: interest.user_id,
            p_type: "pif_status",
            p_payload: {
              title: "Piffen har getts bort",
              content: `Piffen "${post.title}" har getts till ${receiverName}.`,
              reference_id: post.id.toString(),
              reference_type: "item",
              action_url: `/feed?post=${post.id}`
            }
          });
        }
      }
      
      toast({
        title: "Klart!",
        description: "Denna pif har markerats som piffad.",
      });
      
      setPost({ ...post, status: "piffed" });
      
      if (onStatusChange) onStatusChange();
      
      setMarkAsPiffedOpen(false);
      
    } catch (error) {
      console.error("Error marking post as piffed:", error);
      toast({
        title: "Fel",
        description: "Misslyckades att markera denna pif som piffad. Försök igen.",
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
          {loading ? (
            <div className="p-8 text-center">Laddar information...</div>
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
            <div className="p-8 text-center">Posten hittades inte</div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={markAsPiffedOpen} onOpenChange={setMarkAsPiffedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Markera som piffad</AlertDialogTitle>
            <AlertDialogDescription>
              Detta markerar piffen som given. Mottagaren kommer att kunna bekräfta att de har fått den.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkAsPiffed} 
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "Bearbetar..." : "Bekräfta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
