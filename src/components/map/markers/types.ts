import type { Post } from "@/types/post";

export interface EnhancedPost {
  post: Post;
  originalCoordinates: { lng: number; lat: number };
  privacyCoordinates: { lng: number; lat: number };
}

export type PointFeature = GeoJSON.Feature<
  GeoJSON.Point,
  { postIndex: number }
>;
