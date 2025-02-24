
export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  measurements: {
    [key: string]: string;
  };
  images: string[];
  location: string;
  coordinates: string | null;
  postedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  status: string;
}

export type CreatePostInput = Omit<Post, "id" | "postedBy" | "createdAt"> & {
  user_id?: string;
};

export interface Coordinates {
  lat: number;
  lng: number;
}

export const formatCoordinatesForDB = (coords: Coordinates | undefined): string | null => {
  if (!coords) return null;
  return `(${coords.lng},${coords.lat})`;
};

export const parseCoordinatesFromDB = (point: string | null): Coordinates | undefined => {
  if (!point) return undefined;
  const matches = point.match(/\(([-\d.]+),([-\d.]+)\)/);
  if (!matches) return undefined;
  return {
    lng: parseFloat(matches[1]),
    lat: parseFloat(matches[2])
  };
};
