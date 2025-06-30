
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainHeader } from '@/components/layout/MainHeader';
import { Separator } from '@/components/ui/separator';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { CommunityLeaderboard } from '@/components/gamification/CommunityLeaderboard';
import { CommunityChallenges } from '@/components/gamification/CommunityChallenges';
import { PIFStories } from '@/components/stories/PIFStories';
import { Trophy, Target, Star, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

// Mock achievements data
const mockAchievements = [
  {
    id: '1',
    title: 'First Pif',
    description: 'Share your first item with the community',
    icon: '🎉',
    category: 'sharing' as const,
    rarity: 'common' as const,
    unlockedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    reward: { type: 'points' as const, value: 100 }
  },
  {
    id: '2',
    title: 'Community Builder',
    description: 'Help 10 community members',
    icon: '🏗️',
    category: 'social' as const,
    rarity: 'rare' as const,
    progress: 7,
    target: 10,
    reward: { type: 'badge' as const, value: 'Builder Badge' }
  },
  {
    id: '3',
    title: 'Legendary Giver',
    description: 'Complete 100 successful PIFs',
    icon: '👑',
    category: 'sharing' as const,
    rarity: 'legendary' as const,
    progress: 85,
    target: 100,
    reward: { type: 'title' as const, value: 'PIF Legend' }
  }
];

export default function GamificationHub() {
  const [achievements, setAchievements] = useState(mockAchievements);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="container mx-auto px-4 py-6" role="main">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Community Hub
            </h1>
            <p className="text-gray-600 max-w-2xl">
              Discover achievements, compete in challenges, see community rankings, 
              and read inspiring PIF stories from our members.
            </p>
          </div>

          <Tabs defaultValue="achievements" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="challenges" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Challenges
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="stories" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Stories
              </TabsTrigger>
            </TabsList>

            <TabsContent value="achievements">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      size="medium"
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="challenges">
              <CommunityChallenges />
            </TabsContent>

            <TabsContent value="leaderboard">
              <CommunityLeaderboard />
            </TabsContent>

            <TabsContent value="stories">
              <PIFStories />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
