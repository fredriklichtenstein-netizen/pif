
import { useState, useEffect } from "react";
import { optimizeImageUrl } from "@/utils/imageProcessing";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholderSrc?: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  className,
  placeholderSrc = "https://api.dicebear.com/7.x/shapes/svg?seed=placeholder",
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholderSrc);
  
  // Optimize image URL
  const optimizedSrc = src ? optimizeImageUrl(src, width) : placeholderSrc;
  
  useEffect(() => {
    if (!priority && src) {
      const img = new Image();
      img.src = optimizedSrc;
      
      img.onload = () => {
        setCurrentSrc(optimizedSrc);
        setLoaded(true);
      };
      
      img.onerror = () => {
        setError(true);
        setCurrentSrc(placeholderSrc);
      };
      
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [optimizedSrc, placeholderSrc, priority, src]);
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <img
        src={priority ? optimizedSrc : currentSrc}
        alt={alt || ""}
        className={`${className} ${!loaded && !priority ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onError={() => {
          setError(true);
          setCurrentSrc(placeholderSrc);
        }}
        {...props}
      />
      
      {!loaded && !priority && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
}

export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
  ...props
}: {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt || "User avatar"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      {...props}
    />
  );
}
