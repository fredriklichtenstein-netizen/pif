import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import Supercluster from "supercluster";
import type { Post } from "@/types/post";
import { addLocationPrivacy } from "@/utils/locationPrivacy";
import type { EnhancedPost, PointFeature } from "./types";

interface UseClusterInitArgs {
  map: mapboxgl.Map;
  posts: Post[];
  targetItemId?: string | null;
  enhancedPostsRef: React.MutableRefObject<EnhancedPost[]>;
  clusterIndexRef: React.MutableRefObject<Supercluster<
    { postIndex: number },
    { postIndex: number }
  > | null>;
  clearMarkers: () => void;
  setMapReady: (ready: boolean) => void;
}

export function useClusterInit({
  map,
  posts,
  targetItemId,
  enhancedPostsRef,
  clusterIndexRef,
  clearMarkers,
  setMapReady,
}: UseClusterInitArgs) {
  useEffect(() => {
    const initializeClusters = async () => {
      const validPosts = posts.filter((post) => {
        if (!post.coordinates) return false;
        const { lng, lat } = post.coordinates;
        return (
          typeof lng === "number" &&
          typeof lat === "number" &&
          !isNaN(lng) &&
          !isNaN(lat)
        );
      });

      if (validPosts.length === 0) {
        clearMarkers();
        return;
      }

      const enhancedPosts = await Promise.all(
        validPosts.map(async (post) => {
          const { lng, lat } = post.coordinates;
          try {
            const [privacyLng, privacyLat] = await addLocationPrivacy(
              lng,
              lat,
              map
            );
            return {
              post,
              originalCoordinates: { lng, lat },
              privacyCoordinates: { lng: privacyLng, lat: privacyLat },
            };
          } catch {
            const minimalOffsetLng = lng + (Math.random() - 0.5) * 0.001;
            const minimalOffsetLat = lat + (Math.random() - 0.5) * 0.001;
            return {
              post,
              originalCoordinates: { lng, lat },
              privacyCoordinates: {
                lng: minimalOffsetLng,
                lat: minimalOffsetLat,
              },
            };
          }
        })
      );

      enhancedPostsRef.current = enhancedPosts;

      // Tiny anti-stacking jitter (~±2 meters) so coincident offsets still
      // render as distinct pins at max zoom instead of overlapping pixel-perfect.
      const JITTER_DEG = 0.00002;
      const features: PointFeature[] = enhancedPosts.map((ep, index) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [
            ep.privacyCoordinates.lng + (Math.random() - 0.5) * JITTER_DEG,
            ep.privacyCoordinates.lat + (Math.random() - 0.5) * JITTER_DEG,
          ],
        },
        properties: { postIndex: index },
      }));

      clusterIndexRef.current = new Supercluster({
        radius: 60,
        maxZoom: 14,
        minZoom: 0,
        minPoints: 2,
      });
      clusterIndexRef.current.load(features);

      const sessionInitialized = typeof sessionStorage !== 'undefined'
        && sessionStorage.getItem('map_session_initialized');

      if (targetItemId) {
        const targetPost = enhancedPosts.find(
          (ep) => ep.post.id === targetItemId
        );
        if (targetPost) {
          map.flyTo({
            center: [
              targetPost.privacyCoordinates.lng,
              targetPost.privacyCoordinates.lat,
            ],
            zoom: 15,
            duration: 2000,
          });
        }
      } else if (!sessionInitialized && enhancedPosts.length > 0) {
        // Only auto-fit on the very first session load when no PIF address
        // centering has happened yet. MapContainer will set the session flag
        // when it centers on the user's PIF address, suppressing this fit.
        const bounds = new mapboxgl.LngLatBounds();
        enhancedPosts.forEach((ep) =>
          bounds.extend([ep.privacyCoordinates.lng, ep.privacyCoordinates.lat])
        );

        map.fitBounds(bounds, {
          padding: { top: 160, bottom: 120, left: 80, right: 80 },
          maxZoom: 13,
          duration: 1500,
        });
        try { sessionStorage.setItem('map_session_initialized', '1'); } catch {}
      }

      setMapReady(true);
    };

    initializeClusters();
  }, [posts, map, targetItemId, clearMarkers, enhancedPostsRef, clusterIndexRef, setMapReady]);
}
