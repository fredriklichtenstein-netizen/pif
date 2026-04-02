
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { useItemDetailPage } from '@/hooks/item/detail/useItemDetailPage';
import { ItemDetailLoader } from '@/components/item/detail/ItemDetailLoader';
import { ItemDetailError } from '@/components/item/detail/ItemDetailError';
import { ItemDetailContainer } from '@/components/item/detail/ItemDetailContainer';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { withRetry } from '@/utils/connectionRetryUtils';
import { MainNav } from '@/components/MainNav';

export default function ItemDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const fromShare = location.state?.fromShare === true;
  const shareTimestamp = location.state?.timestamp;
  const [loadFailed, setLoadFailed] = useState(false);
  
  useEffect(() => {
  }, [id, fromShare, shareTimestamp]);
  
  const {
    redirectTo404,
    isLoading,
    error,
    displayItem,
    postedBy,
    coordinates,
    measurementsRecord,
    handleRetry,
    realtimeError,
    refreshItemData,
  } = useItemDetailPage();
  
  // Enhanced error logging
  useEffect(() => {
    if (error) {
      console.error('Error loading item details:', error);
      setLoadFailed(true);
    }
    if (redirectTo404) {
      console.error('Item not found, redirecting to 404. Item ID:', id);
    }
  }, [error, redirectTo404, id]);
  
  // If coming from a share link, provide more context in the error logs
  useEffect(() => {
    if (fromShare) {
      // Track share link usage analytics
      try {
        // Store in localStorage for analytics
        const shareVisits = JSON.parse(localStorage.getItem('pif_share_visits') || '[]');
        shareVisits.push({
          id,
          timestamp: new Date().toISOString(),
          shareOriginTimestamp: shareTimestamp,
          success: !redirectTo404 && !error && !!displayItem
        });
        
        // Keep only the last 20 entries
        while (shareVisits.length > 20) shareVisits.shift();
        
        localStorage.setItem('pif_share_visits', JSON.stringify(shareVisits));
        
        // Show toast for successful share navigation
        if (!redirectTo404 && !error && displayItem) {
          toast({
            title: "Shared item loaded",
            description: `You're viewing an item shared with you`,
          });
        }
      } catch (err) {
        console.error('Failed to track share analytics:', err);
      }
    }
  }, [fromShare, id, redirectTo404, error, shareTimestamp, displayItem, toast]);

  // Enhanced retry logic for shared items
  const handleRetryWithBackoff = async () => {
    setLoadFailed(false);
    try {
      await withRetry(
        async () => {
          await refreshItemData();
          return true;
        },
        {
          maxAttempts: 3,
          initialDelay: 500,
          backoffFactor: 2,
          onRetry: (attempt, delay) => {
            toast({
              title: "Retrying...",
              description: `Attempt ${attempt} to load the item`
            });
          }
        }
      );
    } catch (error) {
      console.error('Failed to load item after multiple retries:', error);
      setLoadFailed(true);
      toast({
        title: "Loading failed",
        description: "Could not load the item after multiple attempts",
        variant: "destructive"
      });
    }
  };
  
  if (redirectTo404) {
    return <Navigate to="/404" replace state={{ from: 'item', itemId: id }} />;
  }

  // Show loading state
  if (isLoading && !displayItem) {
    return <ItemDetailLoader />;
  }

  // Handle error state with user feedback and retry option
  if ((error && !displayItem) || loadFailed) {
    console.error('Error loading item:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        {fromShare && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error loading this shared item. The content may have been removed or is no longer available.
            </AlertDescription>
          </Alert>
        )}
        <ItemDetailError onRetry={handleRetryWithBackoff} />
      </div>
    );
  }
  return (
    <>
      <ItemDetailContainer 
        displayItem={displayItem}
        postedBy={postedBy}
        coordinates={coordinates}
        measurements={measurementsRecord}
        realtimeError={realtimeError}
        refreshItemData={refreshItemData}
      />
      <MainNav />
    </>
  );
}
