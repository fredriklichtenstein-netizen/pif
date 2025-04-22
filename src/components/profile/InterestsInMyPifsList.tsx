
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

/**
 * Group interests by item, and show interested users for each item.
 */
export function InterestsInMyPifsList({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("items")
      .select("id,title,created_at,interests:interests(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data as any[]) || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <div className="py-10 text-center text-gray-400">Loading...</div>;
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
    <div className="flex flex-col gap-8">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <Link to={`/feed?post=${item.id}`} className="font-semibold text-lg mb-1 hover:underline block">{item.title}</Link>
          <div className="text-xs text-gray-400 mb-2">{item.created_at && new Date(item.created_at).toLocaleDateString()}</div>
          <div className="mb-2 text-sm text-gray-500">
            {item.interests?.length
              ? `${item.interests.length} user(s) have shown interest`
              : "No interests yet."}
          </div>
          <div className="flex flex-col gap-2">
            {item.interests?.map((int) =>
              int.user_id ? (
                <div key={int.id} className="flex items-center gap-4">
                  <span className="font-medium text-base">{int.user_id.slice(0, 6)}...</span>
                  <span>
                    {int.status === "pending" && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 rounded text-xs">Pending</span>
                    )}
                    {int.status === "selected" && (
                      <span className="bg-green-100 text-green-700 px-2 rounded text-xs">Selected</span>
                    )}
                    {int.status === "not_selected" && (
                      <span className="bg-gray-200 text-gray-500 px-2 rounded text-xs">Not Selected</span>
                    )}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{int.created_at && new Date(int.created_at).toLocaleDateString()}</span>
                </div>
              ) : null
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
