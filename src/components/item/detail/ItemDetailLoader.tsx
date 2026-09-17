
import { CardSkeleton } from '@/components/ui/skeleton';

export function ItemDetailLoader() {
  return (
    // Matches ItemDetailContainer's max-w-3xl so the skeleton doesn't
    // visibly jump in width once the real item data loads.
    <div className="max-w-3xl mx-auto px-4 py-8">
      <CardSkeleton />
    </div>
  );
}
