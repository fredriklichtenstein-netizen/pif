
interface ClusterMarkerElementProps {
  count: number;
  onClick?: () => void;
}

// Create cluster marker element
export const createClusterElement = ({ count, onClick }: ClusterMarkerElementProps): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = "cursor-pointer";
  
  // Calculate size based on count
  const size = Math.min(28 + Math.log2(count) * 8, 56);
  const fontSize = Math.min(12 + Math.log2(count) * 2, 18);
  
  // Create outer container
  const container = document.createElement("div");
  container.style.position = "relative";
  container.style.width = `${size}px`;
  container.style.height = `${size}px`;
  
  // Create pulse ring
  const pulse = document.createElement("div");
  pulse.style.position = "absolute";
  pulse.style.top = "-4px";
  pulse.style.left = "-4px";
  pulse.style.width = `${size + 8}px`;
  pulse.style.height = `${size + 8}px`;
  pulse.style.borderRadius = "50%";
  pulse.style.backgroundColor = "rgba(99, 102, 241, 0.2)";
  pulse.style.animation = "pulse 2s infinite";
  
  // Create main cluster circle
  const circle = document.createElement("div");
  circle.style.position = "absolute";
  circle.style.top = "0";
  circle.style.left = "0";
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;
  circle.style.backgroundColor = "#6366F1"; // Indigo for clusters
  circle.style.borderRadius = "50%";
  circle.style.border = "3px solid white";
  circle.style.boxShadow = "0 3px 10px rgba(0,0,0,0.25)";
  circle.style.display = "flex";
  circle.style.alignItems = "center";
  circle.style.justifyContent = "center";
  circle.style.transition = "transform 0.2s ease";
  
  // Create count label
  const label = document.createElement("span");
  label.style.color = "white";
  label.style.fontSize = `${fontSize}px`;
  label.style.fontWeight = "700";
  label.textContent = count > 99 ? "99+" : String(count);
  
  circle.appendChild(label);
  container.appendChild(pulse);
  container.appendChild(circle);
  el.appendChild(container);
  
  // Hover effect
  el.addEventListener("mouseenter", () => {
    circle.style.transform = "scale(1.1)";
  });
  el.addEventListener("mouseleave", () => {
    circle.style.transform = "scale(1)";
  });
  
  if (onClick) {
    el.addEventListener("click", onClick);
  }
  
  return el;
};
