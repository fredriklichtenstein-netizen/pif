import { useCallback } from "react";
import mapboxgl from "mapbox-gl";
import type Supercluster from "supercluster";
import { createMapPopup } from "../MapPopup";
import { createMarkerElement } from "../MapMarkerElement";
import { createClusterElement } from "../ClusterMarkerElement";
import { useRefreshSyncStore } from "@/stores/refreshSyncStore";
import type { EnhancedPost } from "./types";

/** True while a feed/map refresh is in flight. Read synchronously
 *  inside Mapbox event callbacks (which live outside React). */
const isRefreshNow = () => useRefreshSyncStore.getState().isRefreshing;

interface UseMarkerFactoryArgs {
  map: mapboxgl.Map;
  onPostClick: (postId: string) => void;
  clusterIndexRef: React.MutableRefObject<Supercluster<
    { postIndex: number },
    { postIndex: number }
  > | null>;
}

export function useMarkerFactory({
  map,
  onPostClick,
  clusterIndexRef,
}: UseMarkerFactoryArgs) {
  const createPostMarker = useCallback(
    (enhancedPost: EnhancedPost) => {
      const { post, privacyCoordinates } = enhancedPost;
      const rawType = String(post.item_type || "offer");
      const itemType: "offer" | "request" =
        rawType === "request" || rawType === "wish" ? "request" : "offer";

      const markerElement = createMarkerElement({
        onClick: () => {
          if (isRefreshNow()) return;
          onPostClick(post.id);
        },
        onMouseEnter: () => {
          if (isRefreshNow()) return;
          const popup = createMapPopup({
            post,
            displayCoordinates: privacyCoordinates,
          });
          popup.addTo(map);
        },
        onMouseLeave: () => {
          const popups = document.getElementsByClassName("mapboxgl-popup");
          while (popups[0]) popups[0].remove();
        },
        itemType,
      });

      return new mapboxgl.Marker({
        element: markerElement,
        anchor: "center",
      }).setLngLat([privacyCoordinates.lng, privacyCoordinates.lat]);
    },
    [map, onPostClick]
  );

  const createClusterMarker = useCallback(
    (lng: number, lat: number, count: number, clusterId: number) => {
      const clusterElement = createClusterElement({
        count,
        onClick: () => {
          if (isRefreshNow()) return;
          if (clusterIndexRef.current) {
            const expansionZoom =
              clusterIndexRef.current.getClusterExpansionZoom(clusterId);
            map.flyTo({
              center: [lng, lat],
              zoom: Math.min(expansionZoom + 0.5, 17),
              duration: 500,
            });
          }
        },
      });

      return new mapboxgl.Marker({
        element: clusterElement,
        anchor: "center",
      }).setLngLat([lng, lat]);
    },
    [map, clusterIndexRef]
  );

  return { createPostMarker, createClusterMarker };
}
