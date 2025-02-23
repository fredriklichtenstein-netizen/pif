import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Post, CreatePostInput } from "@/types/post";
import { ItemCard } from "@/components/ItemCard";

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
      images: ["https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef"],
      location: "Norrmalm, Stockholm",
      coordinates: "(18.0686,59.3293)",
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
      coordinates: "(18.0725,59.3157)",
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post) => (
          <ItemCard
            key={post.id}
            id={post.id}
            title={post.title}
            description={post.description}
            image={post.images[0]}
            location={post.location}
            coordinates={post.coordinates}
            category={post.category}
            condition={post.condition}
            postedBy={post.postedBy}
          />
        ))}
      </div>
    </div>
  );
};

export default IndexPage;
