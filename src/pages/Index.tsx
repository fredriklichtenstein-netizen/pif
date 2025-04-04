
import { useState, useEffect } from "react";
import { ItemCard } from "@/components/ItemCard";
import { useToast } from "@/hooks/use-toast";
import { getPosts } from "@/services/posts";
import { Post } from "@/types/post";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch posts from database
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await getPosts();
        console.log("Fetched posts:", data);
        setPosts(data || []);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("Failed to load items. Please try again later.");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load items. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [toast]);

  // Filter posts based on selected category
  const filteredPosts = posts.filter(post => {
    if (filter === "all") return true;
    return post.category?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="container max-w-md mx-auto px-4 py-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">PIF Community</h1>
        <p className="text-sm text-gray-500">Sustainable sharing in your neighborhood</p>
      </div>

      {/* Category filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('all')}
        >
          All Items
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'furniture' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('furniture')}
        >
          Furniture
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'electronics' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('electronics')}
        >
          Electronics
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'clothing' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('clothing')}
        >
          Clothing
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'books' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('books')}
        >
          Books
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-gray-500">Loading items...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-10">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-white px-4 py-2 rounded-full text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredPosts.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">
            {filter === 'all' ? 'No items found. Be the first to share something!' : 'No items found in this category.'}
          </p>
        </div>
      )}

      {/* Items list */}
      {!loading && !error && filteredPosts.length > 0 && (
        <div className="space-y-6">
          {filteredPosts.map(post => (
            <ItemCard 
              key={post.id}
              id={post.id}
              title={post.title}
              description={post.description}
              image={post.images && post.images.length > 0 ? post.images[0] : ''}
              images={post.images}
              location={post.location || 'Unknown location'}
              coordinates={post.coordinates ? JSON.parse(post.coordinates) : undefined}
              category={post.category}
              condition={post.condition}
              measurements={post.measurements}
              postedBy={post.postedBy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
