
import { Suspense, lazy } from "react";
import { MainNav } from "@/components/MainNav";
import { FeedProvider } from "@/context/feed";
import { Leaf, Recycle } from "lucide-react";
import { useFeedContext } from "@/context/feed";
import { useEffect, useState } from "react";
import { calculateTotalCommunityImpact } from "@/components/feed/utils/sustainabilityCalculator";
import { FeedLoadingState } from "@/components/feed/FeedLoadingState";

// Lazy load the feed content for better performance
const LazyFeedContent = lazy(() => 
  import("@/components/feed/FeedContent").then(module => ({ 
    default: module.FeedContent 
  }))
);

// Component for displaying community impact stats
function CommunityImpactStats() {
  const { items } = useFeedContext();
  const [impact, setImpact] = useState({
    totalCO2Saved: 0,
    itemCount: 0
  });

  // Calculate impact when items change (not on every render)
  useEffect(() => {
    if (items && items.length > 0) {
      setImpact(calculateTotalCommunityImpact(items));
    }
  }, [items]);

  return (
    <div className="bg-green-50 py-2 px-4 flex items-center justify-center text-xs text-green-700 gap-4 border-b border-green-100">
      <div className="flex items-center gap-1">
        <Leaf className="h-3 w-3" />
        <span>Shared {impact.itemCount} items</span>
      </div>
      <div className="flex items-center gap-1">
        <Recycle className="h-3 w-3" />
        <span>Saved {impact.totalCO2Saved.toLocaleString()} kg CO₂</span>
      </div>
    </div>
  );
}

// Main Feed component wrapped with FeedProvider
export default function Feed() {
  return (
    <FeedProvider>
      <CommunityImpactStats />
      <Suspense fallback={<FeedLoadingState />}>
        <LazyFeedContent />
      </Suspense>
      <MainNav />
    </FeedProvider>
  );
}
