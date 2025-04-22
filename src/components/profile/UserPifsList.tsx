
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterestUsersPopover } from "./InterestUsersPopover";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useNavigate, Link } from "react-router-dom";
import { Pencil, Trash2, ExternalLink } from "lucide-react";

export function UserPifsList({
  userId,
  isOwner: isOwnerOverride,
}: { userId: string; isOwner?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useGlobalAuth();
  const isOwner = typeof isOwnerOverride === "boolean"
    ? isOwnerOverride
    : user && user.id === userId;

  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    // Get all details for potential admin controls
    // `images` is array, `id`, `title`, `description`, `created_at`, etc.
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setItems(data || []);
          setLoading(false);
        });
    });
  }, [userId]);

  const handleEdit = (itemId: number) => {
    navigate(`/post/edit/${itemId}`);
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to delete this PIF?")) return;
    setDeletingId(itemId);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) {
      alert("Error deleting PIF.");
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
    setDeletingId(null);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((item) => {
        // Use first image if possible
        const imageUrl = item.images?.[0] || "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
        return (
          <Card key={item.id} className="flex flex-col p-0 overflow-hidden hover:shadow-lg transition">
            <Link to={`/feed?post=${item.id}`} className="relative">
              <img
                src={imageUrl}
                alt={item.title}
                className="w-full h-40 object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder"; }}
              />
              <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
            </Link>
            <div className="flex-1 flex flex-col p-3">
              <Link to={`/feed?post=${item.id}`} className="font-bold text-lg mb-1 hover:underline">{item.title}</Link>
              <div className="text-xs text-gray-500 mb-1">{item.created_at && new Date(item.created_at).toLocaleDateString()}</div>
              <div className="text-sm text-gray-700 mb-2">{item.description}</div>
              {/* Only show management/interests for owner */}
              {isOwner && (
                <div className="flex flex-col gap-1 mt-2">
                  <div className="mb-2"><InterestUsersPopover itemId={item.id} /></div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item.id)}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
