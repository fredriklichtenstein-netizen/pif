
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PostModal } from "./PostModal";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function InterestedPifsGrid({ userId }: { userId: string }) {
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [regretDialogOpen, setRegretDialogOpen] = useState(false);
  const [selectedInterestId, setSelectedInterestId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interests")
        .select("*,item:items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setInterests(data || []);
    } catch (err) {
      console.error("Error fetching interests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchInterests();
  }, [userId]);

  const handlePostClick = (postId: number) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const handleRegretClick = (interestId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInterestId(interestId);
    setRegretDialogOpen(true);
  };

  const handleConfirmRegret = async () => {
    if (!selectedInterestId) return;
    
    setRemoving(true);
    try {
      const { error } = await supabase
        .from("interests")
        .delete()
        .eq("id", selectedInterestId);
        
      if (error) throw error;
      
      toast({
        title: "Interest removed",
        description: "You are no longer interested in this PIF."
      });
      
      // Refresh the interests list
      fetchInterests();
    } catch (err) {
      console.error("Error removing interest:", err);
      toast({
        title: "Error",
        description: "Failed to remove interest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRemoving(false);
      setRegretDialogOpen(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }
  
  if (interests.length === 0) {
    return (
      <Card className="flex flex-col items-center p-8 gap-2">
        <div className="text-lg font-semibold">No interests yet</div>
        <div className="text-sm text-gray-500">You haven't shown interest in any PIFs yet.</div>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {interests.map((interest) => {
          const item = interest.item || {};
          const imageUrl = item.images?.[0] || "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
          return (
            <Card key={interest.id} className="overflow-hidden hover:shadow-lg transition">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => handlePostClick(item.id)}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder"; }}
                />
                {interest.status === "selected" && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs">
                    Selected
                  </div>
                )}
                {item.status === "piffed" && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-2 py-1 text-xs">
                    Piffed
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <div className="text-xs text-gray-500 mb-2">
                  {interest.created_at && new Date(interest.created_at).toLocaleDateString()}
                </div>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-500 border-red-200 hover:bg-red-50"
                    onClick={(e) => handleRegretClick(interest.id, e)}
                  >
                    Regret Interest
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      <PostModal 
        postId={selectedPostId} 
        open={modalOpen} 
        onOpenChange={setModalOpen}
      />
      
      <AlertDialog open={regretDialogOpen} onOpenChange={setRegretDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Interest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your interest in this PIF?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRegret} 
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? "Removing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
