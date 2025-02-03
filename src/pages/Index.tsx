import { useQuery } from "@tanstack/react-query";
import type { Post, CreatePostInput } from "@/types/post";

export const getPosts = async (): Promise<Post[]> => {
  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      id: "1",
      title: "Vintage Denim Jacket",
      description: "Size M, great condition, perfect for spring!",
      category: "Clothing",
      condition: "Good",
      measurements: {},
      images: ["https://images.unsplash.com/photo-1551533740-f2875a1f2f28"],
      location: "Norrmalm, Stockholm",
      coordinates: {
        lng: 18.0686,
        lat: 59.3293
      },
      postedBy: {
        id: "123",
        name: "John Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=123"
      },
      createdAt: new Date(),
      status: "available"
    },
    {
      id: "2",
      title: "Wooden Bookshelf",
      description: "Sturdy bookshelf, perfect for small spaces",
      category: "Furniture",
      condition: "Good",
      measurements: {},
      images: ["https://images.unsplash.com/photo-1594620302200-9a762244a156"],
      location: "Södermalm, Stockholm",
      coordinates: {
        lng: 18.0725,
        lat: 59.3157
      },
      postedBy: {
        id: "123",
        name: "John Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=123"
      },
      createdAt: new Date(),
      status: "available"
    }
  ];
};

export const addPost = async (post: CreatePostInput): Promise<Post> => {
  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    ...post,
    id: Math.random().toString(),
    postedBy: {
      id: "123",
      name: "John Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=123"
    },
    createdAt: new Date()
  };
};

const IndexPage = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Posts</h1>
      {/* Add your posts display logic here */}
    </div>
  );
};

export default IndexPage;