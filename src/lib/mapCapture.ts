import type mapboxgl from "mapbox-gl";

// Mapbox renders with WebGL and doesn't keep its drawing buffer between
// frames (preserveDrawingBuffer: false, for performance), so a screenshot
// tool reading the canvas later -- html2canvas in the feedback panel --
// gets a blank map with only the HTML markers/controls on top. Pixels can
// only be read inside a render frame, so live maps register here and the
// capture asks each one for a fresh frame first.

const maps = new Set<mapboxgl.Map>();

export function registerCaptureMap(map: mapboxgl.Map): void {
  maps.add(map);
}

/** PNG data URLs of every live map's canvas, read during a fresh render. */
export async function snapshotMaps(timeoutMs = 1500): Promise<Map<HTMLCanvasElement, string>> {
  const shots = new Map<HTMLCanvasElement, string>();
  await Promise.all(
    Array.from(maps).map((map) => {
      let canvas: HTMLCanvasElement;
      try {
        canvas = map.getCanvas();
      } catch {
        maps.delete(map); // removed map
        return Promise.resolve();
      }
      if (!canvas.isConnected) {
        maps.delete(map);
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, timeoutMs);
        map.once("render", () => {
          try {
            shots.set(canvas, canvas.toDataURL("image/png"));
          } catch (err) {
            console.warn("Map snapshot failed", err);
          }
          clearTimeout(timer);
          resolve();
        });
        map.triggerRepaint();
      });
    }),
  );
  return shots;
}
