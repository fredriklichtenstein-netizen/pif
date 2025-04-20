
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { ItemCardWrapper } from "@/components/ItemCardWrapper";
import { ItemCard } from "@/components/ItemCard";
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
    <div className="container max-w-md mx-auto px-4 pb-20">
      <NetworkStatus onRetry={refreshPosts} />
      <div className="space-y-4 mt-4">
        {posts?.map((post) => (
          <ItemCardWrapper key={post.id}>
            <ItemCard 
              id={post.id}
              title={post.title}
              description={post.description}
              image={post.images && post.images.length > 0 ? post.images[0] : ''}
              images={post.images}
              location={post.location}
              coordinates={post.coordinates}
              category={post.category}
              condition={post.condition}
              measurements={post.measurements}
              postedBy={{
                id: post.user_id,
                name: post.user_name || 'Anonymous',
                avatar: post.user_avatar || '',
              }}
            />
          </ItemCardWrapper>
        ))}
        {posts?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No items found</p>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <MainNav />
    </div>
  );
}
