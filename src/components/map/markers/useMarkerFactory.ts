import { useCallback, useEffect, useRef } from "react";
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
  /** Current logged-in user's id, or null for anonymous. Used to
   *  mark own posts with a distinct ring. */
  currentUserId?: string | null;
}

export function useMarkerFactory({
  map,
  onPostClick,
  clusterIndexRef,
  currentUserId,
}: UseMarkerFactoryArgs) {
  // Track the currently-open preview popup and which post it belongs
  // to so a second tap on the same marker navigates to the post while
  // a tap on a different marker replaces the popup.
  const openPopupRef = useRef<{
    popup: mapboxgl.Popup;
    postId: string;
  } | null>(null);

  const closeOpenPopup = useCallback(() => {
    if (openPopupRef.current) {
      try {
        openPopupRef.current.popup.remove();
      } catch { /* ignore */ }
      openPopupRef.current = null;
    }
  }, []);

  // Dismiss the preview when the user taps any empty area of the map
  // (Mapbox's `closeOnClick` already fires on canvas clicks, but this
  // explicit handler also clears our ref state and is a safety net for
  // the two-tap UX on mobile).
  useEffect(() => {
    const handleMapClick = () => closeOpenPopup();
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, closeOpenPopup]);

  const createPostMarker = useCallback(
    (enhancedPost: EnhancedPost) => {
      const { post, privacyCoordinates } = enhancedPost;
      const rawType = String(post.item_type || "offer");
      const itemType: "offer" | "request" =
        rawType === "request" || rawType === "wish" ? "request" : "offer";

      const isOwn =
        !!currentUserId && post.postedBy?.id === currentUserId;

      const markerElement = createMarkerElement({
        onClick: (event) => {
          // Stop propagation so Mapbox's map-click (and our
          // `closeOpenPopup` handler above) doesn't immediately close
          // the popup we're about to open.
          event.stopPropagation();
          if (isRefreshNow()) return;

          const current = openPopupRef.current;
          // Second tap on the marker whose popup is already open →
          // navigate to the post in the feed.
          if (current && current.postId === post.id) {
            closeOpenPopup();
            onPostClick(post.id);
            return;
          }

          // First tap (or tap on a different marker): swap in a
          // preview popup for this post.
          closeOpenPopup();
          const popup = createMapPopup({
            post,
            displayCoordinates: privacyCoordinates,
          });
          popup.addTo(map);
          openPopupRef.current = { popup, postId: post.id };

          // Tapping the popup body navigates to the post.
          const popupEl = popup.getElement();
          const tapTarget = popupEl?.querySelector(".map-popup-tap") as
            | HTMLElement
            | null;
          const handlePopupClick = (e: Event) => {
            e.stopPropagation();
            if (isRefreshNow()) return;
            closeOpenPopup();
            onPostClick(post.id);
          };
          tapTarget?.addEventListener("click", handlePopupClick);

          // Clear ref when the popup closes for any reason.
          popup.on("close", () => {
            if (openPopupRef.current?.popup === popup) {
              openPopupRef.current = null;
            }
          });
        },
        itemType,
        isOwn,
      });

      return new mapboxgl.Marker({
        element: markerElement,
        anchor: "center",
      }).setLngLat([privacyCoordinates.lng, privacyCoordinates.lat]);
    },
    [map, onPostClick, currentUserId, closeOpenPopup]
  );

  const createClusterMarker = useCallback(
    (lng: number, lat: number, count: number, clusterId: number) => {
      const clusterElement = createClusterElement({
        count,
        onClick: () => {
          if (isRefreshNow()) return;
          // Opening a cluster dismisses any open preview.
          closeOpenPopup();
          if (clusterIndexRef.current) {
            const expansionZoom =
              clusterIndexRef.current.getClusterExpansionZoom(clusterId);
            // Land exactly at the split zoom, capped at 15 so we never
            // fly past all the newly-separated pins (Supercluster
            // maxZoom is 14; map maxZoom is 16). Previously used
            // `expansionZoom + 0.5` up to 17, which frequently
            // overshot and left the viewport empty.
            map.flyTo({
              center: [lng, lat],
              zoom: Math.min(expansionZoom, 15),
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
    [map, clusterIndexRef, closeOpenPopup]
  );

  return { createPostMarker, createClusterMarker };
}
