
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ActivityEvent {
  id: string;
  type: 'pif_created' | 'pif_completed' | 'user_followed' | 'comment_added' | 'item_liked';
  timestamp: string;
  data: Record<string, any>;
}

interface UserActivityData {
  recentActivity: ActivityEvent[];
  activityCount: number;
  streakDays: number;
  lastActiveDate: string;
}

export function useUserActivity() {
  const { session } = useAuth();
  const [activityData, setActivityData] = useState<UserActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    // Mock activity data for demo
    const mockActivityData: UserActivityData = {
      recentActivity: [
        {
          id: '1',
          type: 'pif_created',
          timestamp: new Date().toISOString(),
          data: { itemTitle: 'Vintage Camera', category: 'Electronics' }
        },
        {
          id: '2',
          type: 'user_followed',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          data: { userName: 'Emma Andersson' }
        },
        {
          id: '3',
          type: 'pif_completed',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          data: { itemTitle: 'Programming Books', recipient: 'Lars Nilsson' }
        }
      ],
      activityCount: 156,
      streakDays: 7,
      lastActiveDate: new Date().toISOString()
    };

    setTimeout(() => {
      setActivityData(mockActivityData);
      setLoading(false);
    }, 500);
  }, [session?.user?.id]);

  const trackActivity = (type: ActivityEvent['type'], data: Record<string, any>) => {
    // In real implementation, this would send data to Supabase
    console.log('Activity tracked:', { type, data, userId: session?.user?.id });
    
    if (activityData) {
      const newActivity: ActivityEvent = {
        id: Date.now().toString(),
        type,
        timestamp: new Date().toISOString(),
        data
      };
      
      setActivityData({
        ...activityData,
        recentActivity: [newActivity, ...activityData.recentActivity.slice(0, 9)],
        activityCount: activityData.activityCount + 1,
        lastActiveDate: new Date().toISOString()
      });
    }
  };

  return {
    activityData,
    loading,
    trackActivity
  };
}
