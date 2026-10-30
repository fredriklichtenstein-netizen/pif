import { useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type Supercluster from "supercluster";
import { createMapPopup } from "../MapPopup";
import { createMarkerElement } from "../MapMarkerElement";
import { createClusterElement } from "../ClusterMarkerElement";
import { useRefreshSyncStore } from "@/stores/refreshSyncStore";
import type { EnhancedPost } from "./types";
import i18n from "@/i18n";

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
  // to: a second tap on the same marker closes it, a tap on a different
  // marker replaces it. Only the popup's "Öppna i flödet" button leaves
  // the map.
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

      const ownerId = post.user_id ?? post.postedBy?.id;
      const isOwn =
        !!currentUserId &&
        ownerId != null &&
        String(ownerId) === String(currentUserId);

      const markerElement = createMarkerElement({
        onClick: (event) => {
          // Stop propagation so Mapbox's map-click (and our
          // `closeOpenPopup` handler above) doesn't immediately close
          // the popup we're about to open.
          event.stopPropagation();
          if (isRefreshNow()) return;

          const current = openPopupRef.current;
          // Second tap on the marker whose popup is already open → close it.
          if (current && current.postId === post.id) {
            closeOpenPopup();
            return;
          }

          // First tap (or tap on a different marker): swap in a
          // preview popup for this post.
          closeOpenPopup();
          const popup = createMapPopup({
            post,
            ctaLabel: i18n.t("map.open_in_feed"),
            displayCoordinates: privacyCoordinates,
          });
          popup.addTo(map);
          openPopupRef.current = { popup, postId: post.id };

          // The CTA opens the post in the feed; tapping the rest of the
          // popup does nothing (it mustn't fall through to the map and
          // close the popup either).
          const popupEl = popup.getElement();
          popupEl?.addEventListener("click", (e) => e.stopPropagation());
          const cta = popupEl?.querySelector(".map-popup-cta") as HTMLElement | null;
          cta?.addEventListener("click", (e) => {
            e.stopPropagation();
            if (isRefreshNow()) return;
            closeOpenPopup();
            onPostClick(post.id);
          });

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
