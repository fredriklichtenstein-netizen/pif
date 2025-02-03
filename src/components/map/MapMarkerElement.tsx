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
  el.className = "relative group";

  const dot = document.createElement("div");
  dot.className = "w-4 h-4 bg-primary rounded-full cursor-pointer transition-transform group-hover:scale-110 shadow-lg";
  el.appendChild(dot);

  if (onClick) el.addEventListener("click", onClick);
  if (onMouseEnter) el.addEventListener("mouseenter", onMouseEnter);
  if (onMouseLeave) el.addEventListener("mouseleave", onMouseLeave);

  return el;
};