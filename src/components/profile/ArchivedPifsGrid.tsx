
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { supabase } from "@/integrations/supabase/client";
import { parseCoordinatesFromDB } from "@/types/post";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, Loader2 } from "lucide-react";
import { ItemCard } from "@/components/item/ItemCard";

export function ArchivedPifsGrid({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const isOwner = user && user.id === userId;

  const fetchArchivedItems = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*, profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)")
        .eq("user_id", userId)
        .eq("status", "archived")
        .order("archived_at", { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Transform data to match the expected format
      const transformedData = data?.map(item => {
        let coordinates;
        if (item.coordinates) {
          try {
            coordinates = parseCoordinatesFromDB(String(item.coordinates));
          } catch (err) {
            console.error("Failed to parse coordinates:", err);
          }
        }
        
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          images: item.images || [],
          location: item.location,
          coordinates: coordinates,
          category: item.category,
          condition: item.condition,
          measurements: item.measurements || {},
          archived_at: item.archived_at,
          archived_reason: item.archived_reason,
          postedBy: {
            id: item.user_id,
            name: item.profiles ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() : 'Unknown User',
            avatar: item.profiles?.avatar_url || ''
          }
        };
      }) || [];
      
      setItems(transformedData);
    } catch (err) {
      console.error("Error fetching archived items:", err);
      toast({
        title: "Error",
        description: "Failed to load archived items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedItems();
  }, [userId]);

  const handleRestore = async (itemId: number) => {
    if (!isOwner) return;
    
    setRestoring(itemId);
    try {
      const { error } = await supabase
        .from("items")
        .update({
          status: null,
          archived_at: null,
          archived_reason: null
        })
        .eq("id", itemId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Item restored",
        description: "Your PIF has been restored and is now visible in your active PIFs"
      });
      
      // Remove the restored item from the list
      setItems(items.filter(item => item.id !== itemId));
    } catch (err) {
      console.error("Error restoring item:", err);
      toast({
        title: "Error",
        description: "Failed to restore item",
        variant: "destructive"
      });
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        Loading archived PIFs...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg font-semibold mb-2">No archived PIFs</p>
        <p className="text-gray-500">You don't have any archived PIFs at the moment.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="relative">
          <ItemCard {...item} />
          
          {isOwner && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white bg-opacity-90 hover:bg-white shadow-md flex items-center gap-1"
                onClick={() => handleRestore(item.id)}
                disabled={restoring === item.id}
              >
                {restoring === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <ArchiveRestore className="h-4 w-4 mr-1" />
                )}
                Restore
              </Button>
            </div>
          )}
          
          {item.archived_reason && (
            <div className="mt-2 text-sm text-gray-500 italic px-3">
              <span className="font-medium">Archived reason:</span> {item.archived_reason}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
