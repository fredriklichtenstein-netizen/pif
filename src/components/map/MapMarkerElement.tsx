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

  // Create the main marker element with more visible styling
  const marker = document.createElement("div");
  marker.className = "w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg";
  marker.style.backgroundColor = "rgb(var(--primary))"; // Ensure the primary color is applied

  el.appendChild(marker);

  if (onClick) el.addEventListener("click", onClick);
  if (onMouseEnter) el.addEventListener("mouseenter", onMouseEnter);
  if (onMouseLeave) el.addEventListener("mouseleave", onMouseLeave);

  return el;
};