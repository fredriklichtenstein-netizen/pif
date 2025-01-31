import { ItemCard } from "@/components/ItemCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Post } from "@/types/post";

// Initialize with some mock data
let POSTS: Post[] = [
  {
    id: "1",
    title: "Vintage Denim Jacket",
    description: "Size M, great condition, perfect for spring!",
    images: ["https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800"],
    location: "2.5 km away",
    category: "Clothing",
    condition: "Good",
    measurements: {
      Chest: "52cm",
      Length: "65cm",
      Shoulders: "45cm",
      Sleeves: "60cm"
    },
    postedBy: {
      id: "user1",
      name: "Sarah K.",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "Wooden Bookshelf",
    description: "Sturdy bookshelf, perfect for small spaces",
    images: ["https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800"],
    location: "1.2 km away",
    category: "Furniture",
    condition: "Like New",
    measurements: {
      Width: "80cm",
      Depth: "30cm",
      Height: "180cm"
    },
    postedBy: {
      id: "user2",
      name: "Mike R.",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    createdAt: new Date(),
  },
];

// Mock API functions
const getPosts = async () => POSTS;
const addPost = async (post: Omit<Post, "id" | "postedBy" | "createdAt">) => {
  const newPost: Post = {
    ...post,
    id: (POSTS.length + 1).toString(),
    postedBy: {
      id: "current-user",
      name: "Current User",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    createdAt: new Date(),
  };
  POSTS = [newPost, ...POSTS];
  return newPost;
};

const Index = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm py-4 px-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-primary">Community Thrift</h1>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-white rounded-lg shadow-md h-[400px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {posts?.map((post) => (
              <ItemCard
                key={post.id}
                id={post.id}
                title={post.title}
                description={post.description}
                image={post.images[0]}
                location={post.location}
                category={post.category}
                condition={post.condition}
                postedBy={post.postedBy}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export { addPost };
export default Index;