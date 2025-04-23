
import { useState, useEffect } from "react";
import { optimizeImageUrl } from "@/utils/image";

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
    // When src changes, reset states
    setLoaded(false);
    setError(false);
    
    if (!priority && src) {
      const img = new Image();
      img.src = optimizedSrc;
      
      img.onload = () => {
        setCurrentSrc(optimizedSrc);
        setLoaded(true);
      };
      
      img.onerror = () => {
        console.error(`Failed to load image: ${optimizedSrc}`);
        setError(true);
        setCurrentSrc(placeholderSrc);
      };
      
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    } else if (priority && src) {
      setCurrentSrc(optimizedSrc);
    }
  }, [optimizedSrc, placeholderSrc, priority, src]);
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <img
        src={priority ? optimizedSrc : currentSrc}
        alt={alt || ""}
        className={`${className} ${!loaded && !priority ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          console.error(`Error loading image at render time: ${currentSrc}`);
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
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}) {
  // Ensure consistent fallbacks for users
  const uniqueSeed = alt || 'anonymous';
  const fallbackSrc = `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueSeed}`;
  
  // Track if we need to use the fallback
  const [useFallback, setUseFallback] = useState(false);
  
  // Reset fallback state when src changes
  useEffect(() => {
    setUseFallback(false);
  }, [src]);
  
  // Debug information
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`AvatarImage rendering with src: ${src || 'null'}, fallback using seed: ${uniqueSeed}`);
    }
  }, [src, uniqueSeed]);
    
  return (
    <OptimizedImage
      src={useFallback || !src ? fallbackSrc : src}
      alt={alt || "User avatar"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className || ''}`}
      placeholderSrc={fallbackSrc}
      onError={() => {
        console.log("Avatar image error, using fallback");
        setUseFallback(true);
      }}
      {...props}
    />
  );
}
