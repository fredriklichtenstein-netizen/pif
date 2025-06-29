
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { MainNav } from "@/components/MainNav";
import { MainHeader } from "@/components/layout/MainHeader";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { useFeedPosts } from "@/hooks/useFeedPosts";

export default function Feed() {
  const { refreshPosts } = useFeedPosts();

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />
      <div className="container max-w-md mx-auto px-4 pb-20 flex-1">
        <NetworkStatus onRetry={refreshPosts} />
        <FeedHeader />
        <OptimizedFeedContainer />
      </div>
      <MainNav />
    </div>
  );
}
