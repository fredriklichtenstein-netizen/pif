
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { InterestUsersPopover } from "./InterestUsersPopover";

export function UserPifsList({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Loading your PIFs...</div>;
  }
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center p-8 gap-2">
        <div className="text-lg font-semibold">No PIFs yet</div>
        <div className="text-sm text-gray-500">You haven’t posted any PIFs yet.</div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col p-4">
          <div className="font-semibold text-lg">{item.title}</div>
          <div className="text-xs text-gray-500 mb-2">{item.created_at && new Date(item.created_at).toLocaleDateString()}</div>
          <div className="text-sm text-gray-700 mb-2">{item.description}</div>
          {/* Show interested users */}
          <InterestUsersPopover itemId={item.id} />
          {/* Add edit/delete buttons here if desired */}
        </Card>
      ))}
    </div>
  );
}
