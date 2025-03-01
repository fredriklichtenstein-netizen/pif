
import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Post, CreatePostInput } from "@/types/post";
import { ItemCard } from "@/components/ItemCard";
import { parseCoordinatesFromDB } from "@/types/post";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ItemWithProfile = Database['public']['Tables']['items']['Row'] & {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

export const getPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      profiles!fk_user_profile (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }

  return (data as ItemWithProfile[]).map(item => ({
    id: item.id.toString(),
    title: item.title,
    description: item.description || '',
    category: item.category || '',
    condition: item.condition || '',
    measurements: item.measurements as Record<string, string> || {},
    images: item.images || [],
    location: item.location || '',
    coordinates: item.coordinates as string | null,
    status: item.status || 'available',
    createdAt: item.created_at,
    postedBy: {
      id: item.user_id || '',
      name: item.profiles
        ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`
        : 'Anonymous',
      avatar: item.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=123'
    }
  }));
};

export const addPost = async (post: CreatePostInput): Promise<Post> => {
  const session = await supabase.auth.getSession();
  if (!session.data.session?.user) {
    throw new Error("Must be logged in to create a post");
  }

  const user_id = session.data.session.user.id;
  console.log("Creating post with user_id:", user_id);

  const { data, error } = await supabase
    .from('items')
    .insert([{
      title: post.title,
      description: post.description,
      category: post.category,
      condition: post.condition,
      measurements: post.measurements || {},
      images: post.images,
      location: post.location,
      coordinates: post.coordinates,
      user_id: user_id,
      status: post.status || 'available'
    }])
    .select(`
      *,
      profiles!fk_user_profile (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error("Error adding post:", error);
    throw error;
  }

  const itemWithProfile = data as ItemWithProfile;

  return {
    id: itemWithProfile.id.toString(),
    title: itemWithProfile.title,
    description: itemWithProfile.description || '',
    category: itemWithProfile.category || '',
    condition: itemWithProfile.condition || '',
    measurements: itemWithProfile.measurements as Record<string, string> || {},
    images: itemWithProfile.images || [],
    location: itemWithProfile.location || '',
    coordinates: itemWithProfile.coordinates as string | null,
    status: itemWithProfile.status || 'available',
    createdAt: itemWithProfile.created_at,
    postedBy: {
      id: itemWithProfile.user_id || '',
      name: itemWithProfile.profiles
        ? `${itemWithProfile.profiles.first_name || ''} ${itemWithProfile.profiles.last_name || ''}`
        : 'Anonymous',
      avatar: itemWithProfile.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=123'
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
    <div className="container mx-auto px-4 py-6 pb-36">
      <h1 className="text-2xl font-bold mb-6">Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts?.map((post) => (
          <ItemCard
            key={post.id}
            id={post.id}
            title={post.title}
            description={post.description}
            image={post.images[0]}
            images={post.images}
            location={post.location}
            coordinates={post.coordinates ? parseCoordinatesFromDB(post.coordinates) : undefined}
            category={post.category}
            condition={post.condition}
            measurements={post.measurements}
            postedBy={post.postedBy}
          />
        ))}
      </div>
    </div>
  );
};

export default IndexPage;
