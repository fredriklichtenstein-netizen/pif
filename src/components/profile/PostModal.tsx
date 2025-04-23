
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ItemCard } from "@/components/post/ItemCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PostModalProps = {
  postId: number | null;
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

  useEffect(() => {
    if (open && postId) {
      setLoading(true);
      supabase
        .from("items")
        .select("*, profiles!items_user_id_fkey(*)")
        .eq("id", postId)
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
      const { error } = await supabase
        .from("items")
        .update({ status: "piffed" })
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
          
        const receiverName = selectedInterest?.users?.first_name || "Someone";
        
        for (const interest of interests) {
          await supabase.rpc("create_notification", {
            p_user_id: interest.user_id,
            p_type: "pif_status",
            p_title: "PIF has been given away",
            p_content: `The PIF "${post.title}" has been given to ${receiverName}.`,
            p_reference_id: post.id.toString(),
            p_reference_type: "item",
            p_action_url: `/feed?post=${post.id}`
          });
        }
      }
      
      toast({
        title: "Success!",
        description: "This PIF has been marked as piffed.",
      });
      
      setPost({ ...post, status: "piffed" });
      
      if (onStatusChange) onStatusChange();
      
      setMarkAsPiffedOpen(false);
      
    } catch (error) {
      console.error("Error marking post as piffed:", error);
      toast({
        title: "Error",
        description: "Failed to mark this PIF as piffed. Please try again.",
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
            <div className="p-8 text-center">Loading post details...</div>
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
              markAsPiffedAction={() => setMarkAsPiffedOpen(true)}
            />
          ) : (
            <div className="p-8 text-center">Post not found</div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={markAsPiffedOpen} onOpenChange={setMarkAsPiffedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Piffed</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the PIF as given away and notify all interested users.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkAsPiffed} 
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
