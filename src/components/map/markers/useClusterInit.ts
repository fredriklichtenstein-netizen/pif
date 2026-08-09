import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import Supercluster from "supercluster";
import type { Post } from "@/types/post";
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
  /**
   * Incremented after each successful async cluster rebuild so
   * `useViewportMarkers` re-runs `updateMarkers` and repaints markers
   * with the fresh cluster index / enhanced posts. Without this,
   * updates after the first render would race and leave stale markers
   * on screen until the next viewport interaction.
   */
  bumpClusterVersion: () => void;
}

export function useClusterInit({
  map,
  posts,
  targetItemId,
  enhancedPostsRef,
  clusterIndexRef,
  clearMarkers,
  setMapReady,
  bumpClusterVersion,
}: UseClusterInitArgs) {
  useEffect(() => {
    let cancelled = false;

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
        if (cancelled) return;
        clearMarkers();
        enhancedPostsRef.current = [];
        clusterIndexRef.current = new Supercluster({
          radius: 60,
          maxZoom: 14,
          minZoom: 0,
          minPoints: 2,
        });
        clusterIndexRef.current.load([]);
        setMapReady(true);
        bumpClusterVersion();
        return;
      }

      // post.coordinates is ALREADY the coarse public point: the database
      // serves `coordinates_public`, offset 150-500 m from the true position by
      // a deterministic, row-seeded function, and never releases the exact
      // value here at all.
      //
      // The offset deliberately does NOT happen on the client any more. It used
      // to, via addLocationPrivacy(), which was decorative in two ways: the true
      // coordinate was in the API response regardless, and the offset was
      // redrawn with Math.random() on every render, so averaging a handful of
      // page loads recovered the exact address. Do not reintroduce a
      // client-side offset — it cannot protect data the client already holds.
      const enhancedPosts = validPosts.map((post) => {
        const { lng, lat } = post.coordinates;
        return {
          post,
          originalCoordinates: { lng, lat },
          privacyCoordinates: { lng, lat },
        };
      });

      // A newer posts array arrived mid-run — drop this stale pass entirely.
      if (cancelled) return;

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

      const index = new Supercluster<
        { postIndex: number },
        { postIndex: number }
      >({
        radius: 60,
        maxZoom: 14,
        minZoom: 0,
        minPoints: 2,
      });
      index.load(features);

      enhancedPostsRef.current = enhancedPosts;
      clusterIndexRef.current = index;

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
      // Notify viewport-marker layer that the cluster index is fresh
      // so it re-runs updateMarkers with the new data.
      bumpClusterVersion();
    };

    initializeClusters();

    return () => {
      cancelled = true;
    };
  }, [posts, map, targetItemId, clearMarkers, enhancedPostsRef, clusterIndexRef, setMapReady, bumpClusterVersion]);
}
