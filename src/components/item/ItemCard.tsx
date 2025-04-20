
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface ItemCardProps {
  title: string;
  category: string;
  image: string;
}

export function ItemCard({ title, category, image }: ItemCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <OptimizedImage
          src={image}
          alt={title}
          className="w-full h-[240px] object-cover"
          width={600}
          height={400}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
          <div className="absolute bottom-3 left-3 text-white">
            <h3 className="font-semibold mb-1">{title}</h3>
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              {category}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
