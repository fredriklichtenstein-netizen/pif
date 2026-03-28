import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PostModal } from "./PostModal";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { useDemoSelectionsStore } from "@/stores/demoSelectionsStore";
import { useDemoCompletionStore, type CompletionStatus } from "@/stores/demoCompletionStore";
import { MOCK_POSTS } from "@/data/mockPosts";
import { ReceiverConfirmation } from "./completion/ReceiverConfirmation";
import { CompletionStatusBadge } from "./completion/CompletionStatusBadge";
import { Check } from "lucide-react";
import { DEMO_USER } from "@/data/mockProfiles";
import { useTranslation } from "react-i18next";

export function InterestedPifsGrid({ userId }: { userId: string }) {
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<number | string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [regretDialogOpen, setRegretDialogOpen] = useState(false);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [confirmationItem, setConfirmationItem] = useState<any | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const interestedItems = useDemoInteractionsStore((state) => state.interestedItems);
  const toggleInterest = useDemoInteractionsStore((state) => state.toggleInterest);
  const isUserSelected = useDemoSelectionsStore((state) => state.isUserSelected);
  const getStatus = useDemoCompletionStore((state) => state.getStatus);

  const fetchInterests = async () => {
    setLoading(true);
    
    if (DEMO_MODE) {
      const interestedPosts = MOCK_POSTS
        .filter(post => interestedItems.includes(post.id))
        .map(post => {
          const isSelected = isUserSelected(post.id, DEMO_USER.id);
          const completionStatus = getStatus(post.id);
          
          return {
            id: `interest-${post.id}`,
            item_id: post.id,
            created_at: new Date().toISOString(),
            status: isSelected ? "selected" : null,
            completionStatus,
            item: {
              ...post,
              status: completionStatus === "pending_confirmation" ? "piffed" : 
                      completionStatus === "completed" ? "completed" :
                      completionStatus === "archived" ? "archived" : "active",
            },
          };
        });
      
      setInterests(interestedPosts);
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("interests")
        .select("*,item:items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setInterests(data || []);
    } catch (err) {
      console.error("Error fetching interests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchInterests();
  }, [userId, interestedItems]);

  const completions = useDemoCompletionStore((state) => state.completions);
  useEffect(() => {
    if (DEMO_MODE && userId) {
      fetchInterests();
    }
  }, [completions]);

  const handlePostClick = (postId: number | string) => {
    setSelectedPostId(postId);
    setModalOpen(true);
  };

  const handleRegretClick = (interestId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInterestId(DEMO_MODE ? itemId : interestId);
    setRegretDialogOpen(true);
  };

  const handleConfirmRegret = async () => {
    if (!selectedInterestId) return;
    
    setRemoving(true);
    
    if (DEMO_MODE) {
      toggleInterest(selectedInterestId);
      toast({
        title: t('interactions.interest_removed'),
        description: t('interactions.interest_removed_description'),
      });
      setRemoving(false);
      setRegretDialogOpen(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("interests")
        .delete()
        .eq("id", typeof selectedInterestId === 'string' ? parseInt(selectedInterestId, 10) : selectedInterestId);
        
      if (error) throw error;
      
      toast({
        title: t('interactions.interest_removed'),
        description: t('interactions.interest_removed_description'),
      });
      
      fetchInterests();
    } catch (err) {
      console.error("Error removing interest:", err);
      toast({
        title: t('post.error'),
        description: t('interactions.interest_remove_error'),
        variant: "destructive"
      });
    } finally {
      setRemoving(false);
      setRegretDialogOpen(false);
    }
  };

  const handleConfirmReceipt = (interest: any) => {
    setConfirmationItem(interest.item);
  };

  const getItemStatus = (interest: any): CompletionStatus => {
    if (DEMO_MODE) {
      return interest.completionStatus || "active";
    }
    const dbStatus = interest.item?.status;
    if (dbStatus === "piffed") return "pending_confirmation";
    if (dbStatus === "completed") return "completed";
    if (dbStatus === "archived") return "archived";
    return "active";
  };

  const canConfirmReceipt = (interest: any): boolean => {
    const status = getItemStatus(interest);
    const isSelected = interest.status === "selected";
    return isSelected && status === "pending_confirmation";
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">{t('interactions.loading')}</div>;
  }
  
  if (interests.length === 0) {
    return (
      <Card className="flex flex-col items-center p-8 gap-2">
        <div className="text-lg font-semibold">{t('interactions.no_interests_title')}</div>
        <div className="text-sm text-muted-foreground">{t('interactions.no_interests_description')}</div>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {interests.map((interest) => {
          const item = interest.item || {};
          const imageUrl = item.images?.[0] || "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder";
          const itemId = DEMO_MODE ? item.id : item.id;
          const itemStatus = getItemStatus(interest);
          const showConfirmButton = canConfirmReceipt(interest);
          
          return (
            <Card key={interest.id} className="overflow-hidden hover:shadow-lg transition">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => handlePostClick(itemId)}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder"; }}
                />
                {interest.status === "selected" && itemStatus === "active" && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 text-xs rounded">
                    {t('interactions.selected')}
                  </div>
                )}
                {itemStatus !== "active" && (
                  <div className="absolute top-2 left-2">
                    <CompletionStatusBadge status={itemStatus} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <div className="text-xs text-muted-foreground mb-2">
                  {interest.created_at && new Date(interest.created_at).toLocaleDateString('sv-SE')}
                </div>
                
                <div className="mt-2 space-y-2">
                  {showConfirmButton && (
                    <Button 
                      variant="default"
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmReceipt(interest);
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t('interactions.confirm_receipt')}
                    </Button>
                  )}
                  
                  {itemStatus === "active" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-red-500 border-red-200 hover:bg-red-50"
                      onClick={(e) => handleRegretClick(interest.id, item.id, e)}
                    >
                      {t('interactions.regret_interest')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      <PostModal 
        postId={selectedPostId} 
        open={modalOpen} 
        onOpenChange={setModalOpen}
      />
      
      <AlertDialog open={regretDialogOpen} onOpenChange={setRegretDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('interactions.remove_interest_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('interactions.remove_interest_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>{t('interactions.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmRegret} 
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? t('interactions.removing') : t('interactions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {confirmationItem && (
        <ReceiverConfirmation
          itemId={confirmationItem.id}
          itemTitle={confirmationItem.title}
          pifferName={confirmationItem.postedBy?.name || "Piffern"}
          open={!!confirmationItem}
          onOpenChange={(open) => !open && setConfirmationItem(null)}
          onConfirmed={() => {
            setConfirmationItem(null);
            fetchInterests();
          }}
        />
      )}
    </>
  );
}
