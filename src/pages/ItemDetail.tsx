
import { useParams } from 'react-router-dom';
import { useItemCard } from '@/hooks/useItemCard';
import { ItemCard } from '@/components/post/ItemCard';
import { Loader2 } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams();
  
  if (!id) {
    return <div>Item not found</div>;
  }

  // Todo: Add proper item fetching logic here
  // For now we'll show a loading state
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
