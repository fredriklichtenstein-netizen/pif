
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Gift } from 'lucide-react';
import { FadeIn } from '@/components/animation/FadeIn';
import { SlideIn } from '@/components/animation/SlideIn';

interface LeaderboardEntry {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    location: string;
  };
  rank: number;
  score: number;
  change: 'up' | 'down' | 'same' | 'new';
  metrics: {
    pifsGiven: number;
    pifsReceived: number;
    communityPoints: number;
    helpfulRating: number;
  };
}

export function CommunityLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<{
    weekly: LeaderboardEntry[];
    monthly: LeaderboardEntry[];
    allTime: LeaderboardEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock leaderboard data
    const mockData = {
      weekly: [
        {
          id: '1',
          user: { id: 'u1', name: 'Emma Andersson', location: 'Stockholm' },
          rank: 1,
          score: 450,
          change: 'up' as const,
          metrics: { pifsGiven: 8, pifsReceived: 2, communityPoints: 450, helpfulRating: 4.9 }
        },
        {
          id: '2',
          user: { id: 'u2', name: 'Lars Nilsson', location: 'Göteborg' },
          rank: 2,
          score: 380,
          change: 'same' as const,
          metrics: { pifsGiven: 6, pifsReceived: 4, communityPoints: 380, helpfulRating: 4.7 }
        },
        {
          id: '3',
          user: { id: 'u3', name: 'Maria Santos', location: 'Malmö' },
          rank: 3,
          score: 320,
          change: 'down' as const,
          metrics: { pifsGiven: 5, pifsReceived: 3, communityPoints: 320, helpfulRating: 4.8 }
        }
      ],
      monthly: [
        {
          id: '1',
          user: { id: 'u3', name: 'Maria Santos', location: 'Malmö' },
          rank: 1,
          score: 1250,
          change: 'up' as const,
          metrics: { pifsGiven: 25, pifsReceived: 8, communityPoints: 1250, helpfulRating: 4.8 }
        },
        {
          id: '2',
          user: { id: 'u1', name: 'Emma Andersson', location: 'Stockholm' },
          rank: 2,
          score: 1180,
          change: 'same' as const,
          metrics: { pifsGiven: 22, pifsReceived: 6, communityPoints: 1180, helpfulRating: 4.9 }
        }
      ],
      allTime: [
        {
          id: '1',
          user: { id: 'u1', name: 'Emma Andersson', location: 'Stockholm' },
          rank: 1,
          score: 5200,
          change: 'same' as const,
          metrics: { pifsGiven: 120, pifsReceived: 25, communityPoints: 5200, helpfulRating: 4.9 }
        }
      ]
    };

    setTimeout(() => {
      setLeaderboardData(mockData);
      setLoading(false);
    }, 800);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <div className="h-5 w-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</div>;
    }
  };

  const getChangeIcon = (change: LeaderboardEntry['change']) => {
    switch (change) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!leaderboardData) return null;

  const renderLeaderboard = (entries: LeaderboardEntry[]) => (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <SlideIn key={entry.id} direction="left" delay={index * 100}>
          <Card className={`p-4 ${entry.rank <= 3 ? 'border-2 border-yellow-200 bg-yellow-50' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getRankIcon(entry.rank)}
                {getChangeIcon(entry.change)}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.user.avatar} />
                <AvatarFallback>{entry.user.name[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-semibold">{entry.user.name}</h3>
                <p className="text-sm text-gray-500">{entry.user.location}</p>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{entry.score}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
              
              <div className="hidden md:flex flex-col gap-1 text-right">
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="h-4 w-4 text-green-500" />
                  <span>{entry.metrics.pifsGiven} given</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  ⭐ {entry.metrics.helpfulRating}
                </Badge>
              </div>
            </div>
          </Card>
        </SlideIn>
      ))}
    </div>
  );

  return (
    <FadeIn>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Community Leaderboard
        </h2>
        
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="allTime">All Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="mt-6">
            {renderLeaderboard(leaderboardData.weekly)}
          </TabsContent>
          
          <TabsContent value="monthly" className="mt-6">
            {renderLeaderboard(leaderboardData.monthly)}
          </TabsContent>
          
          <TabsContent value="allTime" className="mt-6">
            {renderLeaderboard(leaderboardData.allTime)}
          </TabsContent>
        </Tabs>
      </Card>
    </FadeIn>
  );
}
