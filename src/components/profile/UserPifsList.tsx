
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InterestUsersPopover } from "./interest/InterestUsersPopover";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useNavigate, Link } from "react-router-dom";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";

export function UserPifsList({
  userId,
  isOwner: isOwnerOverride,
}: { userId: string; isOwner?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useGlobalAuth();
  const { t } = useTranslation();
  const isOwner = typeof isOwnerOverride === "boolean"
    ? isOwnerOverride
    : user && user.id === userId;

  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
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
    if (!window.confirm(t('interactions.confirm_delete_pif'))) return;
    setDeletingId(itemId);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) {
      alert(t('interactions.error_deleting_pif'));
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
    setDeletingId(null);
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">{t('profile.loading_pifs')}</div>;
  }
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center p-8 gap-2">
        <div className="text-lg font-semibold">{t('profile.no_pifs_title')}</div>
        <div className="text-sm text-muted-foreground">{t('profile.no_pifs_description')}</div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((item) => {
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
              <div className="text-xs text-muted-foreground mb-1">{item.created_at && new Date(item.created_at).toLocaleDateString()}</div>
              <div className="text-sm text-muted-foreground mb-2">{item.description}</div>
              {isOwner && (
                <div className="flex flex-col gap-1 mt-2">
                  <div className="mb-2"><InterestUsersPopover itemId={item.id} itemOwnerId={userId} /></div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item.id)}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {t('interactions.edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === item.id ? t('profile.deleting') : t('interactions.delete')}
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
