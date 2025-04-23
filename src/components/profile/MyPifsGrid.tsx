
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AvatarImage } from "@/components/ui/optimized-image";
import { supabase } from "@/integrations/supabase/client";
import { PostModal } from "./PostModal";
import { InterestUsersPopover } from "./InterestUsersPopover";
import { format } from "date-fns";

export function MyPifsGrid({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPifs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching PIFs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPifs();
  }, [userId]);

  const handlePostClick = (postId: number) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const handleStatusChange = () => {
    // Refresh the data after status change
    fetchPifs();
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading your PIFs...</div>;
  }
  
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center p-8 gap-2">
        <div className="text-lg font-semibold">No PIFs yet</div>
        <div className="text-sm text-gray-500">You haven't posted any PIFs yet.</div>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const imageUrl = item.images?.[0] || "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
          return (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => handlePostClick(item.id)}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder"; }}
                />
                {item.status === "piffed" && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs">
                    Piffed
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {item.created_at && format(new Date(item.created_at), "yyyy-MM-dd")}
                </div>
              </div>
              <div className="p-3">
                <InterestUsersPopover itemId={item.id} />
              </div>
            </Card>
          );
        })}
      </div>
      
      <PostModal 
        postId={selectedPostId} 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
