interface MapMarkerElementProps {
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const createMarkerElement = ({
  onClick,
  onMouseEnter,
  onMouseLeave,
}: MapMarkerElementProps): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = "cursor-pointer";

  // Create the main marker element with simpler styling
  const marker = document.createElement("div");
  marker.className = "w-4 h-4 bg-primary rounded-full border border-white transform transition-transform duration-200 hover:scale-110";

  el.appendChild(marker);

  if (onClick) el.addEventListener("click", onClick);
  if (onMouseEnter) el.addEventListener("mouseenter", onMouseEnter);
  if (onMouseLeave) el.addEventListener("mouseleave", onMouseLeave);

  return el;
};