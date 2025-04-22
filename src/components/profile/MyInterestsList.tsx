
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

export function MyInterestsList({ userId }: { userId: string }) {
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("interests")
        .select("*,item:items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setInterests(data || []);
          setLoading(false);
        });
    });
  }, [userId]);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {interests.map((int) => {
        const item = int.item || {};
        const imageUrl = item.images?.[0] || "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
        return (
          <Card key={int.id} className="p-0 flex flex-col overflow-hidden hover:shadow-lg transition">
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
              <Link to={`/feed?post=${item.id}`} className="font-semibold text-base hover:underline">{item.title}</Link>
              <div className="text-xs text-gray-400 mb-1">
                {int.created_at && new Date(int.created_at).toLocaleDateString()}
              </div>
              <div className="mb-1 text-gray-600 text-sm line-clamp-2">{item.description}</div>
              <div>
                {int.status === "pending" && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 rounded text-xs">Pending</span>
                )}
                {int.status === "selected" && (
                  <span className="bg-green-100 text-green-700 px-2 rounded text-xs">Selected</span>
                )}
                {int.status === "not_selected" && (
                  <span className="bg-gray-200 text-gray-500 px-2 rounded text-xs">Not Selected</span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
