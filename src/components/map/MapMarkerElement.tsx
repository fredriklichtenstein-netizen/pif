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
  dot.className = "w-6 h-6 bg-primary rounded-full cursor-pointer transition-all duration-200 group-hover:scale-110 shadow-lg border-2 border-white";
  
  // Add a pulse animation
  const pulse = document.createElement("div");
  pulse.className = "absolute -inset-1 bg-primary/30 rounded-full animate-pulse";
  
  el.appendChild(pulse);
  el.appendChild(dot);

  if (onClick) el.addEventListener("click", onClick);
  if (onMouseEnter) el.addEventListener("mouseenter", onMouseEnter);
  if (onMouseLeave) el.addEventListener("mouseleave", onMouseLeave);

  return el;
};