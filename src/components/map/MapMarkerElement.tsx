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
  
  // Create an outer container for the marker with a shadow
  const markerContainer = document.createElement("div");
  markerContainer.className = "relative";
  markerContainer.style.width = "24px";
  markerContainer.style.height = "24px";
  
  // Create the main marker dot
  const markerDot = document.createElement("div");
  markerDot.style.position = "absolute";
  markerDot.style.top = "0";
  markerDot.style.left = "0";
  markerDot.style.width = "24px";
  markerDot.style.height = "24px";
  markerDot.style.backgroundColor = "#2F5233";
  markerDot.style.borderRadius = "50%";
  markerDot.style.border = "3px solid white";
  markerDot.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
  
  // Add a pulse animation effect
  const pulse = document.createElement("div");
  pulse.style.position = "absolute";
  pulse.style.top = "-4px";
  pulse.style.left = "-4px";
  pulse.style.width = "32px";
  pulse.style.height = "32px";
  pulse.style.borderRadius = "50%";
  pulse.style.backgroundColor = "rgba(47, 82, 51, 0.2)";
  pulse.style.animation = "pulse 2s infinite";
  
  // Add the pulse animation keyframes
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 0.8;
      }
      70% {
        transform: scale(1.3);
        opacity: 0;
      }
      100% {
        transform: scale(1.3);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  markerContainer.appendChild(pulse);
  markerContainer.appendChild(markerDot);
  el.appendChild(markerContainer);

  if (onClick) el.addEventListener("click", onClick);
  if (onMouseEnter) el.addEventListener("mouseenter", onMouseEnter);
  if (onMouseLeave) el.addEventListener("mouseleave", onMouseLeave);

  return el;
};