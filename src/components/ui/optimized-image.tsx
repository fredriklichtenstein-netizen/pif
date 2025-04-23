
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

// Array of friendly animal avatar URLs
const animalAvatars = [
  "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1", // kitten
  "https://images.unsplash.com/photo-1517022812141-23620dba5c23", // sheep
  "https://images.unsplash.com/photo-1582562124811-c09040d0a901", // cat
  "https://images.unsplash.com/photo-1472396961693-142e6e269027", // deer
  "https://images.unsplash.com/photo-1498936178812-4b2e558d2937", // bees
  "https://images.unsplash.com/photo-1518877593221-1f28583780b4", // whale
  "https://images.unsplash.com/photo-1439886183900-e79ec0057170", // deers
  "https://images.unsplash.com/photo-1441057206919-63d19fac2369", // penguins
  "https://images.unsplash.com/photo-1501286353178-1ec881214838", // monkey
  "https://images.unsplash.com/photo-1487252665478-49b61b47f302"  // lizards
];

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
  // Generate a consistent index based on the user seed
  const uniqueSeed = alt || 'anonymous';
  
  // Create a simple hash of the seed string to always get the same animal avatar for the same user
  const getAnimalAvatarIndex = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    // Ensure positive value and get a valid index
    return Math.abs(hash) % animalAvatars.length;
  };
  
  // Get fallback animal avatar based on unique seed
  const animalIndex = getAnimalAvatarIndex(uniqueSeed);
  const fallbackSrc = `${animalAvatars[animalIndex]}?w=${size * 2}&fit=crop&auto=format&q=80`;
  
  // Track if we need to use the fallback
  const [useFallback, setUseFallback] = useState(false);
  
  // Reset fallback state when src changes
  useEffect(() => {
    setUseFallback(false);
  }, [src]);
  
  // Debug information
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`AvatarImage rendering with src: ${src || 'null'}, fallback: ${fallbackSrc}`);
    }
  }, [src, fallbackSrc]);
    
  return (
    <OptimizedImage
      src={useFallback || !src ? fallbackSrc : src}
      alt={alt || "User avatar"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className || ''}`}
      placeholderSrc={fallbackSrc}
      onError={() => {
        console.log("Avatar image error, using animal fallback");
        setUseFallback(true);
      }}
      priority={true}
      {...props}
    />
  );
}
