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
  el.className = "relative group cursor-pointer";

  const marker = document.createElement("div");
  marker.className = "w-6 h-6 bg-primary rounded-full shadow-lg border-2 border-white transform transition-transform duration-200 group-hover:scale-110";
  
  const pulse = document.createElement("div");
  pulse.className = "absolute -inset-1 rounded-full animate-pulse bg-primary/20";
  
  el.appendChild(pulse);
  el.appendChild(marker);

  if (onClick) el.addEventListener("click", onClick);
  if (onMouseEnter) el.addEventListener("mouseenter", onMouseEnter);
  if (onMouseLeave) el.addEventListener("mouseleave", onMouseLeave);

  return el;
};