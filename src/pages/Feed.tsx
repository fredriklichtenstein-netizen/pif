
import { MainNav } from "@/components/MainNav";
import { FeedProvider } from "@/context/feed";
import { FeedContent } from "@/components/feed/FeedContent";

// Main Feed component wrapped with FeedProvider
export default function Feed() {
  return (
    <FeedProvider>
      <FeedContent />
      <MainNav />
    </FeedProvider>
  );
}
