
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { ItemCardWrapper } from "@/components/ItemCardWrapper";
import { ItemCard } from "@/components/ItemCard";
import { usePostForm } from "@/hooks/usePostForm";
import { Loader2 } from "lucide-react";

export default function Feed() {
  const { posts, isLoading, error, refreshPosts } = usePostForm();

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
            <ItemCard item={post} />
          </ItemCardWrapper>
        ))}
        {posts?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}
