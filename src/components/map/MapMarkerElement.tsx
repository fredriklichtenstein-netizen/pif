
interface MapMarkerElementProps {
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  highlighted?: boolean;
  itemType?: 'offer' | 'request';
}

// Color configurations for different item types
const MARKER_COLORS = {
  offer: {
    main: "#0D9488", // teal for pifs
    pulse: "rgba(13, 148, 136, 0.2)",
  },
  request: {
    main: "#F59E0B", // amber for wishes
    pulse: "rgba(245, 158, 11, 0.2)",
  },
};

// Create and cache element templates to improve performance
const createElementTemplate = (itemType: 'offer' | 'request' = 'offer'): HTMLDivElement => {
  const colors = MARKER_COLORS[itemType];
  
  const el = document.createElement("div");
  el.className = "cursor-pointer";
  
  // Create an outer container for the marker with a shadow
  const markerContainer = document.createElement("div");
  markerContainer.className = "relative marker-animated";
  markerContainer.style.width = "28px";
  markerContainer.style.height = "28px";
  
  // Create the main marker dot
  const markerDot = document.createElement("div");
  markerDot.style.position = "absolute";
  markerDot.style.top = "0";
  markerDot.style.left = "0";
  markerDot.style.width = "28px";
  markerDot.style.height = "28px";
  markerDot.style.backgroundColor = colors.main;
  markerDot.style.borderRadius = "50%";
  markerDot.style.border = "3px solid white";
  markerDot.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  markerDot.style.display = "flex";
  markerDot.style.alignItems = "center";
  markerDot.style.justifyContent = "center";
  
  // Add icon inside marker
  const icon = document.createElement("span");
  icon.style.color = "white";
  icon.style.fontSize = "12px";
  icon.style.fontWeight = "bold";
  icon.innerHTML = itemType === 'request' ? '?' : '♥';
  markerDot.appendChild(icon);
  
  // Add a pulse animation effect
  const pulse = document.createElement("div");
  pulse.style.position = "absolute";
  pulse.style.top = "-4px";
  pulse.style.left = "-4px";
  pulse.style.width = "36px";
  pulse.style.height = "36px";
  pulse.style.borderRadius = "50%";
  pulse.style.backgroundColor = colors.pulse;
  pulse.style.animation = "pulse 2s infinite";
  
  markerContainer.appendChild(pulse);
  markerContainer.appendChild(markerDot);
  el.appendChild(markerContainer);
  
  return el;
};

// Create a single style element for animations instead of creating one per marker
const ensureAnimationStyles = (() => {
  let initialized = false;
  
  return () => {
    if (!initialized) {
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
        @keyframes markerPopIn {
          0% {
            transform: scale(0) translateY(10px);
            opacity: 0;
          }
          60% {
            transform: scale(1.1) translateY(-2px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        @keyframes markerPopOut {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }
        .marker-animated {
          animation: markerPopIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .marker-exit {
          animation: markerPopOut 0.2s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
      initialized = true;
    }
  };
})();

// Element template caches for each type
const elementTemplates: { [key: string]: HTMLDivElement } = {};

export const createMarkerElement = ({
  onClick,
  onMouseEnter,
  onMouseLeave,
  highlighted = false,
  itemType = 'offer',
}: MapMarkerElementProps): HTMLDivElement => {
  // Ensure animation styles are added to the document
  ensureAnimationStyles();
  
  // Create or clone from template based on item type
  if (!elementTemplates[itemType]) {
    elementTemplates[itemType] = createElementTemplate(itemType);
  }
  
  const el = elementTemplates[itemType].cloneNode(true) as HTMLDivElement;
  
  // Apply highlighting if needed
  if (highlighted) {
    const markerDot = el.querySelector('div > div:nth-child(2)') as HTMLDivElement;
    if (markerDot) {
      markerDot.style.transform = "scale(1.2)";
      markerDot.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
    }
  }

  if (onClick) el.addEventListener("click", onClick);
  if (onMouseEnter) el.addEventListener("mouseenter", onMouseEnter);
  if (onMouseLeave) el.addEventListener("mouseleave", onMouseLeave);

  return el;
};
