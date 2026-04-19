import { useCallback, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type Supercluster from "supercluster";
import type { EnhancedPost } from "./types";

interface UseViewportMarkersArgs {
  map: mapboxgl.Map;
  mapReady: boolean;
  markersRef: React.MutableRefObject<mapboxgl.Marker[]>;
  enhancedPostsRef: React.MutableRefObject<EnhancedPost[]>;
  clusterIndexRef: React.MutableRefObject<Supercluster<
    { postIndex: number },
    { postIndex: number }
  > | null>;
  clearMarkers: () => void;
  createPostMarker: (ep: EnhancedPost) => mapboxgl.Marker;
  createClusterMarker: (
    lng: number,
    lat: number,
    count: number,
    clusterId: number
  ) => mapboxgl.Marker;
}

export function useViewportMarkers({
  map,
  mapReady,
  markersRef,
  enhancedPostsRef,
  clusterIndexRef,
  clearMarkers,
  createPostMarker,
  createClusterMarker,
}: UseViewportMarkersArgs) {
  const updateMarkers = useCallback(() => {
    if (
      !clusterIndexRef.current ||
      !mapReady ||
      enhancedPostsRef.current.length === 0
    )
      return;

    clearMarkers();

    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());

    const clusters = clusterIndexRef.current.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom
    );

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const props = cluster.properties as any;

      if (props.cluster) {
        const marker = createClusterMarker(
          lng,
          lat,
          props.point_count,
          props.cluster_id
        );
        marker.addTo(map);
        markersRef.current.push(marker);
      } else {
        const postIndex = props.postIndex;
        const enhancedPost = enhancedPostsRef.current[postIndex];
        if (enhancedPost) {
          const marker = createPostMarker(enhancedPost);
          marker.addTo(map);
          markersRef.current.push(marker);
        }
      }
    });
  }, [
    map,
    mapReady,
    markersRef,
    enhancedPostsRef,
    clusterIndexRef,
    clearMarkers,
    createPostMarker,
    createClusterMarker,
  ]);

  useEffect(() => {
    if (!mapReady) return;

    const handleUpdate = () => updateMarkers();

    map.on("zoomend", handleUpdate);
    map.on("moveend", handleUpdate);

    updateMarkers();

    return () => {
      map.off("zoomend", handleUpdate);
      map.off("moveend", handleUpdate);
    };
  }, [map, mapReady, updateMarkers]);
}
