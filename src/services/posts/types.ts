
export interface InteractionCounts {
  likesCount: number;
  interestsCount: number;
  commentsCount: number;
}

export interface PostServiceOptions {
  includeArchived?: boolean;
  nearbyLocation?: {
    lat: number;
    lng: number;
    radius?: number;
  };
}
