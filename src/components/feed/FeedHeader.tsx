
import { Gift, Search } from "lucide-react";

interface FeedHeaderProps {
  activeFilter?: 'all' | 'offer' | 'request';
}

export function FeedHeader({ activeFilter = 'all' }: FeedHeaderProps) {
  const getTitle = () => {
    switch (activeFilter) {
      case 'offer':
        return "Piffar i närområdet";
      case 'request':
        return "Önskningar i närområdet";
      default:
        return "PiF Community";
    }
  };

  const getSubtitle = () => {
    switch (activeFilter) {
      case 'offer':
        return "Saker som väntar på nya ägare";
      case 'request':
        return "Saker som behövs i din närhet";
      default:
        return "Sustainable sharing in your neighborhood";
    }
  };

  const getIcon = () => {
    switch (activeFilter) {
      case 'offer':
        return <Gift className="h-6 w-6 text-primary" />;
      case 'request':
        return <Search className="h-6 w-6 text-secondary" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-4 mt-4">
      <div className="flex items-center space-x-2 mb-1">
        {getIcon()}
        <h1 className="text-2xl font-bold">{getTitle()}</h1>
      </div>
      <p className="text-muted-foreground">{getSubtitle()}</p>
    </div>
  );
}
