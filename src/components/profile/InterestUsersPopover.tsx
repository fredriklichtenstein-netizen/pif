
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";

/**
 * Popover that shows users interested in a given item, allows owner to select a receiver.
 */
export function InterestUsersPopover({ itemId }: { itemId: number }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    supabase
      .from("interests")
      .select("id,user_id,status,message,created_at,users:profiles!interests_user_id_fkey(*)")
      .eq("item_id", itemId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUsers(data || []);
        setLoading(false);
      });
  }, [itemId]);

  const handleSelectReceiver = async (interestId: number) => {
    // Piffer selects a receiver by updating status
    await supabase
      .from("interests")
      .update({ status: "selected", selected_at: new Date().toISOString() })
      .eq("id", interestId);
    // Optionally update other interests to "not_selected"
    await supabase
      .from("interests")
      .update({ status: "not_selected" })
      .eq("item_id", itemId)
      .neq("id", interestId);
    // Refresh:
    const { data } = await supabase
      .from("interests")
      .select("id,user_id,status,message,created_at,users:profiles!interests_user_id_fkey(*)")
      .eq("item_id", itemId)
      .order("created_at", { ascending: false });
    setUsers(data || []);
  };

  if (loading) {
    return <div className="text-xs py-2 text-gray-400">Loading interested users...</div>;
  }
  if (users.length === 0) {
    return <div className="text-xs py-2 text-gray-400">No interests yet.</div>;
  }

  return (
    <Card className="p-2 bg-blue-50 mt-2">
      <div className="font-bold text-sm mb-2">Interested Users</div>
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-2">
            <AvatarImage src={u.users?.avatar_url} size={28} alt={u.users?.first_name} />
            <span className="text-sm">{u.users?.first_name} {u.users?.last_name?.[0] || ""}</span>
            <span className="ml-auto">
              {u.status === "selected" && (
                <span className="bg-green-100 text-green-700 px-2 rounded text-xs">Receiver</span>
              )}
              {u.status === "pending" && (
                <Button size="xs" onClick={() => handleSelectReceiver(u.id)}>
                  Select as Receiver
                </Button>
              )}
              {u.status === "not_selected" && (
                <span className="bg-gray-200 text-gray-500 px-2 rounded text-xs">Not Selected</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
