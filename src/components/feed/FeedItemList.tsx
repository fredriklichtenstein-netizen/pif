
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { ItemCard } from "@/components/item/ItemCard";
import { parseCoordinatesFromDB } from "@/types/post";
import { Button } from "@/components/ui/button";

interface FeedItemListProps {
  posts: any[];
  selectedCategories: string[];
  clearFilters: () => void;
  viewMode: string;
}

export function FeedItemList({
  posts,
  selectedCategories,
  clearFilters,
  viewMode,
}: FeedItemListProps) {
  const getEmptyStateMessage = () => {
    if (selectedCategories.length > 0) {
      return "No items found matching your filters";
    }
    
    switch (viewMode) {
      case "saved":
        return "You haven't saved any items yet";
      case "myPifs":
        return "You haven't posted any items yet";
      case "interested":
        return "You haven't shown interest in any items yet";
      default:
        return "No items found";
    }
  };

  return (
    <div className="space-y-4">
      {posts?.map((post) => {
        let coordinates;
        if (post.coordinates) {
          try {
            const coords =
              typeof post.coordinates === "string"
                ? parseCoordinatesFromDB(post.coordinates)
                : post.coordinates;
            coordinates = coords;
          } catch (e) {
            console.error("Failed to parse coordinates:", e, post.coordinates);
          }
        }
        return (
          <NetworkStatusWrapper key={post.id}>
            <ItemCard
              id={post.id}
              title={post.title}
              description={post.description}
              image={post.images && post.images.length > 0 ? post.images[0] : ''}
              images={post.images}
              location={post.location}
              coordinates={coordinates}
              category={post.category}
              condition={post.condition}
              measurements={post.measurements}
              postedBy={{
                id: post.user_id,
                name: post.user_name || 'Anonymous',
                avatar: post.user_avatar || '',
              }}
            />
          </NetworkStatusWrapper>
        );
      })}
      {posts?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>{getEmptyStateMessage()}</p>
          {selectedCategories.length > 0 && (
            <Button
              variant="outline"
              className="mt-2"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
