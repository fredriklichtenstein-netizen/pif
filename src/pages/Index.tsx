import { useQuery } from "@tanstack/react-query";

export const getPosts = async () => {
  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      id: "1",
      title: "Vintage Denim Jacket",
      description: "Size M, great condition, perfect for spring!",
      images: ["https://images.unsplash.com/photo-1551533740-f2875a1f2f28"],
      location: "Norrmalm, Stockholm",
      coordinates: {
        lng: 18.0686,
        lat: 59.3293
      },
      category: "Clothing",
      condition: "Good",
      status: "available",
      user_id: "123",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "2",
      title: "Wooden Bookshelf",
      description: "Sturdy bookshelf, perfect for small spaces",
      images: ["https://images.unsplash.com/photo-1594620302200-9a762244a156"],
      location: "Södermalm, Stockholm",
      coordinates: {
        lng: 18.0725,
        lat: 59.3157
      },
      category: "Furniture",
      condition: "Good",
      status: "available",
      user_id: "123",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};
