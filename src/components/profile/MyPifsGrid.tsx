
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PostModal } from "./PostModal";
import { InterestUsersPopover } from "./InterestUsersPopover";
import { formatRelativeTime } from "@/utils/formatDate";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoPostsStore } from "@/stores/demoPostsStore";
import { MOCK_POSTS } from "@/data/mockPosts";
import { DEMO_USER } from "@/data/mockUser";
import { useEffect } from "react";
import { useMyItemsCache } from "@/hooks/cache/useMyItemsCache";

export function MyPifsGrid({ userId }: { userId: string }) {
  const [selectedPostId, setSelectedPostId] = useState<number | string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const demoUserPosts = useDemoPostsStore((state) => state.getUserPosts);

  const { items, isLoading, refresh, setItems } = useMyItemsCache(
    DEMO_MODE ? null : userId,
    {
      scope: "my-active",
      query: async (uid) => {
        const res = await (supabase
          .from("items")
          .select("*") as any)
          .eq("user_id", uid)
          // Use the same predicate shape as the rest of the Group A query
          // sites. The earlier `.not("pif_status","in","(archived,completed)")`
          // form is the odd one out and has a NULL-handling quirk in
          // PostgREST (`NULL NOT IN (...)` → NULL, not true) that can let
          // rows slip through. The OR form below is the verified pattern.
          .or('pif_status.is.null,and(pif_status.neq.archived,pif_status.neq.completed)')
          .order("created_at", { ascending: false });
        return { data: res.data, error: res.error };
      },
    },
  );

  // Demo mode list (not cached — local mock data).
  const demoItems = (() => {
    if (!DEMO_MODE) return null;
    const userCreatedPosts = demoUserPosts(userId);
    const mockUserPosts =
      userId === DEMO_USER.id
        ? MOCK_POSTS.filter((p) => p.item_type === "pif" || p.item_type === "offer").slice(0, 2)
        : [];
    return [...userCreatedPosts, ...mockUserPosts];
  })();

  const displayedItems = DEMO_MODE ? demoItems ?? [] : items;
  const showLoader = !DEMO_MODE && isLoading;

  // Sync with global archive/delete/restore events.
  useEffect(() => {
    const onSuccess = (e: Event) => {
      const detail = (e as CustomEvent<{ itemId: string | number; operationType: string }>).detail;
      if (!detail) return;
      const idStr = String(detail.itemId);
      if (detail.operationType === "archive" || detail.operationType === "delete") {
        setItems(displayedItems.filter((i) => String(i.id) !== idStr));
      } else if (detail.operationType === "restore") {
        void refresh();
      }
    };
    const onUndone = () => void refresh();
    document.addEventListener("item-operation-success", onSuccess as EventListener);
    document.addEventListener("item-operation-undone", onUndone as EventListener);
    return () => {
      document.removeEventListener("item-operation-success", onSuccess as EventListener);
      document.removeEventListener("item-operation-undone", onUndone as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedItems]);

  const handlePostClick = (postId: number | string) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const handleStatusChange = () => {
    if (!DEMO_MODE) void refresh();
  };

  if (showLoader) {
    return <div className="py-12 text-center text-gray-400">Laddar dina piffar...</div>;
  }

  if (displayedItems.length === 0) {
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
        {displayedItems.map((item) => {
          const imageUrl = item.images?.[0] || "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
          return (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => handlePostClick(item.id)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
                  }}
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
