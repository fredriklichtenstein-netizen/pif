
import { Gift, Search } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface FeedHeaderProps {
  activeFilter?: 'all' | 'offer' | 'request';
}

export function FeedHeader({ activeFilter = 'all' }: FeedHeaderProps) {
  const { t } = useTranslation();

  const getTitle = () => {
    switch (activeFilter) {
      case 'offer':
        return t('feed.offers_title');
      case 'request':
        return t('feed.requests_title');
      default:
        return t('feed.title');
    }
  };

  const getSubtitle = () => {
    switch (activeFilter) {
      case 'offer':
        return t('feed.offers_subtitle');
      case 'request':
        return t('feed.requests_subtitle');
      default:
        return t('feed.subtitle');
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
