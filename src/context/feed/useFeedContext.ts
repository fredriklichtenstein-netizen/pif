
import { useContext } from 'react';
import { FeedContext } from './FeedProvider';

export const useFeedContext = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeedContext must be used within a FeedProvider');
  }
  return context;
};
