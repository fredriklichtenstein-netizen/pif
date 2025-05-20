
import { MainNav } from "@/components/MainNav";
import { FeedProvider } from "@/context/feed";
import { FeedContent } from "@/components/feed/FeedContent";
import { Leaf, Recycle, Earth } from "lucide-react";

// Main Feed component wrapped with FeedProvider
export default function Feed() {
  return (
    <FeedProvider>
      <div className="bg-green-50 py-2 px-4 flex items-center justify-center text-xs text-green-700 gap-4 border-b border-green-100">
        <div className="flex items-center gap-1">
          <Leaf className="h-3 w-3" />
          <span>Shared 234 items</span>
        </div>
        <div className="flex items-center gap-1">
          <Recycle className="h-3 w-3" />
          <span>Saved 5.3 tons CO₂</span>
        </div>
        <div className="flex items-center gap-1">
          <Earth className="h-3 w-3" />
          <span>Local exchanges: 91%</span>
        </div>
      </div>
      <FeedContent />
      <MainNav />
    </FeedProvider>
  );
}
