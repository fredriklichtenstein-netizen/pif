
import { ItemCardWrapper } from "@/components/ItemCardWrapper";
import { ItemCard } from "@/components/item/ItemCard";
import { parseCoordinatesFromDB } from "@/types/post";
import { Button } from "@/components/ui/button";

interface FeedItemListProps {
  posts: any[];
  selectedCategories: string[];
  clearFilters: () => void;
}

export function FeedItemList({
  posts,
  selectedCategories,
  clearFilters,
}: FeedItemListProps) {
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
          <ItemCardWrapper key={post.id}>
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
          </ItemCardWrapper>
        );
      })}
      {posts?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No items found matching your filters</p>
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
