import { useEffect, useState, type RefObject } from "react";

/**
 * True once `ref`'s element is laid out at its real size -- i.e. no CSS
 * transform is scaling it any more. Dialogs open with a zoom-in-95
 * animation; react-easy-crop measures its container with
 * getBoundingClientRect() when the image loads and only re-measures on
 * window resize, so an image that loads mid-animation (fast for a local
 * file) gets a crop area ~5% too small that can never reach the image
 * edges. Mount the cropper only after this returns true.
 */
export function useLayoutSettled(ref: RefObject<HTMLElement>, active = true): boolean {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!active) {
      setSettled(false);
      return;
    }
    let frame = 0;
    const deadline = performance.now() + 1000;
    const check = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const unscaled =
          el.offsetWidth > 0 &&
          Math.abs(rect.width - el.offsetWidth) < 0.5 &&
          Math.abs(rect.height - el.offsetHeight) < 0.5;
        if (unscaled || performance.now() > deadline) {
          setSettled(true);
          return;
        }
      }
      frame = requestAnimationFrame(check);
    };
    frame = requestAnimationFrame(check);
    return () => cancelAnimationFrame(frame);
  }, [ref, active]);

  return settled;
}
