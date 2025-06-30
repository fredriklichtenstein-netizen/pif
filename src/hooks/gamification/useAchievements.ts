
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'social' | 'sharing' | 'community' | 'streak';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  target?: number;
  reward?: {
    type: 'badge' | 'title' | 'points';
    value: string | number;
  };
}

export function useAchievements() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    // Mock achievement data - replace with real Supabase queries
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'First Pif',
        description: 'Share your first item with the community',
        icon: '🎉',
        category: 'sharing',
        rarity: 'common',
        unlockedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        reward: { type: 'points', value: 100 }
      },
      {
        id: '2',
        title: 'Social Butterfly',
        description: 'Follow 10 community members',
        icon: '🦋',
        category: 'social',
        rarity: 'common',
        progress: 7,
        target: 10,
        reward: { type: 'badge', value: 'Social Badge' }
      },
      {
        id: '3',
        title: 'Generous Heart',
        description: 'Give away 5 items successfully',
        icon: '💝',
        category: 'sharing',
        rarity: 'rare',
        unlockedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        reward: { type: 'title', value: 'Generous Member' }
      },
      {
        id: '4',
        title: 'Community Builder',
        description: 'Help 25 community members',
        icon: '🏗️',
        category: 'community',
        rarity: 'epic',
        progress: 18,
        target: 25,
        reward: { type: 'badge', value: 'Builder Badge' }
      },
      {
        id: '5',
        title: 'PIF Legend',
        description: 'Complete 100 successful PIFs',
        icon: '👑',
        category: 'sharing',
        rarity: 'legendary',
        progress: 85,
        target: 100,
        reward: { type: 'title', value: 'PIF Legend' }
      }
    ];

    setTimeout(() => {
      setAchievements(mockAchievements);
      setUnlockedCount(mockAchievements.filter(a => a.unlockedAt).length);
      setLoading(false);
    }, 800);
  }, [session?.user?.id]);

  const checkForNewAchievements = async (action: string, data: any) => {
    // This would contain logic to check if user has unlocked new achievements
    // based on their actions (creating PIFs, following users, etc.)
    
    console.log('Checking achievements for action:', action, data);
    
    // Example: If user created their first PIF
    if (action === 'pif_created' && data.isFirstPif) {
      // Award "First Pif" achievement
      // In real implementation, this would update the database and show a notification
    }
  };

  return {
    achievements,
    loading,
    unlockedCount,
    totalAchievements: achievements.length,
    checkForNewAchievements
  };
}
