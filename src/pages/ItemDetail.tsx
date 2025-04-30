
import { Navigate } from 'react-router-dom';
import { useItemDetailPage } from '@/hooks/item/detail/useItemDetailPage';
import { ItemDetailLoader } from '@/components/item/detail/ItemDetailLoader';
import { ItemDetailError } from '@/components/item/detail/ItemDetailError';
import { ItemDetailContainer } from '@/components/item/detail/ItemDetailContainer';

export default function ItemDetail() {
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
  
  if (redirectTo404) {
    console.log('No item data found, redirecting to 404');
    return <Navigate to="/404" replace />;
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

  console.log('Rendering item:', displayItem);
  
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
