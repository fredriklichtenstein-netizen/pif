
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { MainNav } from "@/components/MainNav";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedContainer } from "@/components/feed/FeedContainer";
import { useFeedPosts } from "@/hooks/useFeedPosts";

export default function Feed() {
  const { refreshPosts } = useFeedPosts();

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      <NetworkStatus onRetry={refreshPosts} />
      <FeedHeader />
      <FeedContainer />
      <MainNav />
    </div>
  );
}
