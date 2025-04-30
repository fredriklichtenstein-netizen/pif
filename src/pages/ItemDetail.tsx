
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { useItemDetailPage } from '@/hooks/item/detail/useItemDetailPage';
import { ItemDetailLoader } from '@/components/item/detail/ItemDetailLoader';
import { ItemDetailError } from '@/components/item/detail/ItemDetailError';
import { ItemDetailContainer } from '@/components/item/detail/ItemDetailContainer';
import { useEffect } from 'react';

export default function ItemDetail() {
  const { id } = useParams();
  const location = useLocation();
  const fromShare = location.state?.fromShare === true;
  
  useEffect(() => {
    console.log(`ItemDetail page loaded with ID: ${id}, fromShare: ${fromShare}`);
  }, [id, fromShare]);
  
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
    }
    if (redirectTo404) {
      console.error('Item not found, redirecting to 404. Item ID:', id);
    }
  }, [error, redirectTo404, id]);
  
  // If coming from a share link, provide more context in the error logs
  useEffect(() => {
    if (fromShare) {
      console.log('User arrived from shared link, ID:', id);
      
      // Track share link usage analytics
      try {
        // Store in localStorage for analytics
        const shareVisits = JSON.parse(localStorage.getItem('pif_share_visits') || '[]');
        shareVisits.push({
          id,
          timestamp: new Date().toISOString(),
          success: !redirectTo404 && !error
        });
        localStorage.setItem('pif_share_visits', JSON.stringify(shareVisits));
      } catch (err) {
        console.error('Failed to track share analytics:', err);
      }
    }
  }, [fromShare, id, redirectTo404, error]);
  
  if (redirectTo404) {
    console.log('No item data found, redirecting to 404');
    return <Navigate to="/404" replace state={{ from: 'item', itemId: id }} />;
  }

  // Show loading state
  if (isLoading && !displayItem) {
    console.log('Item is loading, showing skeleton...');
    return <ItemDetailLoader />;
  }

  // Handle error state with user feedback and retry option
  if (error && !displayItem) {
    console.error('Error loading item:', error);
    return <ItemDetailError onRetry={handleRetry} />;
  }

  console.log('Rendering item:', displayItem?.id);
  
  return (
    <ItemDetailContainer 
      displayItem={displayItem}
      postedBy={postedBy}
      coordinates={coordinates}
      measurements={measurementsRecord}
      realtimeError={realtimeError}
      refreshItemData={refreshItemData}
    />
  );
}
