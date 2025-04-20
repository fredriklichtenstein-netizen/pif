
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { ItemCard } from "@/components/item/ItemCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { Loader2 } from "lucide-react";
import { MainNav } from "@/components/MainNav";

export default function Feed() {
  const { posts, isLoading, error, refreshPosts } = useFeedPosts();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 pb-20">
      <NetworkStatus onRetry={refreshPosts} />
      
      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4">
        <button className="bg-primary text-white px-6 py-2 rounded-full text-sm whitespace-nowrap">
          All Items
        </button>
        <button className="bg-gray-100 px-6 py-2 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
          Furniture
        </button>
        <button className="bg-gray-100 px-6 py-2 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
          Electronics
        </button>
        <button className="bg-gray-100 px-6 py-2 rounded-full text-sm whitespace-nowrap hover:bg-gray-200">
          Clothing
        </button>
      </div>

      <div className="space-y-4 mt-4">
        {posts?.map((post) => (
          <ItemCard
            key={post.id}
            title={post.title}
            category={post.category}
            image={post.images && post.images.length > 0 ? post.images[0] : ''}
          />
        ))}
        {posts?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No items found</p>
          </div>
        )}
      </div>
      
      <MainNav />
    </div>
  );
}
