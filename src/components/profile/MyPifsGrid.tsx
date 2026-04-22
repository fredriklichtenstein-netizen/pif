
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PostModal } from "./PostModal";
import { InterestUsersPopover } from "./interest/InterestUsersPopover";
import { formatRelativeTime } from "@/utils/formatDate";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoPostsStore } from "@/stores/demoPostsStore";
import { MOCK_POSTS } from "@/data/mockPosts";
import { DEMO_USER } from "@/data/mockUser";

export function MyPifsGrid({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<number | string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const demoUserPosts = useDemoPostsStore((state) => state.getUserPosts);

  const fetchPifs = async () => {
    setLoading(true);
    
    // Demo mode: show user-created demo posts + mock posts from "demo user"
    if (DEMO_MODE) {
      const userCreatedPosts = demoUserPosts(userId);
      // In demo mode, if viewing demo user's profile, show their mock posts
      const mockUserPosts = userId === DEMO_USER.id 
        ? MOCK_POSTS.filter(p => p.item_type === 'pif' || p.item_type === 'offer').slice(0, 2)
        : [];
      
      setItems([...userCreatedPosts, ...mockUserPosts]);
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Error fetching piffar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPifs();
  }, [userId]);

  // Sync with global archive/delete/restore events so the grid updates without a refresh.
  useEffect(() => {
    const onSuccess = (e: Event) => {
      const detail = (e as CustomEvent<{ itemId: string | number; operationType: string }>).detail;
      if (!detail) return;
      const idStr = String(detail.itemId);
      if (detail.operationType === 'archive' || detail.operationType === 'delete') {
        // Remove from local list immediately.
        setItems((prev) => prev.filter((i) => String(i.id) !== idStr));
      } else if (detail.operationType === 'restore') {
        // Refetch so the restored item reappears with full data.
        fetchPifs();
      }
    };
    const onUndone = (e: Event) => {
      const detail = (e as CustomEvent<{ itemId: string | number; operationType: string }>).detail;
      if (!detail) return;
      // Either an undone archive (item is back) or a restore — refetch to be safe.
      fetchPifs();
    };
    document.addEventListener('item-operation-success', onSuccess as EventListener);
    document.addEventListener('item-operation-undone', onUndone as EventListener);
    return () => {
      document.removeEventListener('item-operation-success', onSuccess as EventListener);
      document.removeEventListener('item-operation-undone', onUndone as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handlePostClick = (postId: number | string) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const handleStatusChange = () => {
    // Refresh the data after status change
    fetchPifs();
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Laddar dina piffar...</div>;
  }
  
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center p-8 gap-2">
        <div className="text-lg font-semibold">Inga piffar än</div>
        <div className="text-sm text-gray-500">Du har inte piffat något än.</div>
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
                    Piffad
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {item.created_at && formatRelativeTime(new Date(item.created_at))}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-medium truncate mb-2">{item.title}</h3>
                {!DEMO_MODE && <InterestUsersPopover itemId={item.id} itemOwnerId={userId} />}
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
