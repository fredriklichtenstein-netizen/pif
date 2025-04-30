
import { CardSkeleton } from '@/components/ui/skeleton';

export function ItemDetailLoader() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CardSkeleton />
    </div>
  );
}
