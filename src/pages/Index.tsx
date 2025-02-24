
import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Post } from "@/types/post";
import { ItemCard } from "@/components/ItemCard";
import { parseCoordinatesFromDB } from "@/types/post";
import { supabase } from "@/integrations/supabase/client";

export const getPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      postedBy:user_id (
        id,
        profiles (
          first_name,
          last_name,
          avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }

  return data.map(item => ({
    id: item.id.toString(),
    title: item.title,
    description: item.description || '',
    category: item.category || '',
    condition: item.condition || '',
    measurements: {}, // Initialize with empty object if not present
    images: item.images || [],
    location: item.location || '',
    coordinates: item.coordinates,
    status: item.status || 'available',
    createdAt: item.created_at,
    postedBy: {
      id: item.postedBy?.id || '',
      name: item.postedBy?.profiles?.[0]?.first_name 
        ? `${item.postedBy.profiles[0].first_name} ${item.postedBy.profiles[0].last_name || ''}`
        : 'Anonymous',
      avatar: item.postedBy?.profiles?.[0]?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=123'
    }
  }));
};

export const addPost = async (post: CreatePostInput): Promise<Post> => {
  const { data, error } = await supabase
    .from('items')
    .insert([{
      title: post.title,
      description: post.description,
      category: post.category,
      condition: post.condition,
      measurements: post.measurements,
      images: post.images,
      location: post.location,
      coordinates: post.coordinates,
      user_id: post.user_id,
      status: post.status
    }])
    .select(`
      *,
      postedBy:user_id (
        id,
        profiles (
          first_name,
          last_name,
          avatar_url
        )
      )
    `)
    .single();

  if (error) {
    console.error("Error adding post:", error);
    throw error;
  }

  return {
    id: data.id.toString(),
    title: data.title,
    description: data.description || '',
    category: data.category || '',
    condition: data.condition || '',
    measurements: data.measurements || {},
    images: data.images || [],
    location: data.location || '',
    coordinates: data.coordinates,
    status: data.status || 'available',
    createdAt: data.created_at,
    postedBy: {
      id: data.postedBy?.id || '',
      name: data.postedBy?.profiles?.[0]?.first_name 
        ? `${data.postedBy.profiles[0].first_name} ${data.postedBy.profiles[0].last_name || ''}`
        : 'Anonymous',
      avatar: data.postedBy?.profiles?.[0]?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=123'
    }
  };
};

const IndexPage = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
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
            coordinates={post.coordinates ? parseCoordinatesFromDB(post.coordinates) : undefined}
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
