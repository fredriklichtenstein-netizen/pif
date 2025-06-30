
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Users, Gift, Calendar, Clock, CheckCircle } from 'lucide-react';
import { FadeIn } from '@/components/animation/FadeIn';
import { SlideIn } from '@/components/animation/SlideIn';
import { formatDistanceToNow } from 'date-fns';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'community' | 'location';
  category: 'sharing' | 'social' | 'environmental' | 'learning';
  difficulty: 'easy' | 'medium' | 'hard';
  startDate: string;
  endDate: string;
  progress: number;
  target: number;
  participants: number;
  maxParticipants?: number;
  reward: {
    type: 'badge' | 'points' | 'title';
    value: string | number;
    description: string;
  };
  isParticipating: boolean;
  isCompleted: boolean;
}

export function CommunityChallenges() {
  const [challenges, setChallenges] = useState<{
    active: Challenge[];
    upcoming: Challenge[];
    completed: Challenge[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock challenges data
    const mockChallenges = {
      active: [
        {
          id: '1',
          title: 'Share the Love Week',
          description: 'Give away 5 items to community members this week',
          type: 'individual' as const,
          category: 'sharing' as const,
          difficulty: 'medium' as const,
          startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          progress: 3,
          target: 5,
          participants: 156,
          reward: {
            type: 'badge' as const,
            value: '🌟 Generous Heart',
            description: 'Special badge for generous community members'
          },
          isParticipating: true,
          isCompleted: false
        },
        {
          id: '2',
          title: 'Stockholm Community Goal',
          description: 'Help Stockholm reach 1000 PIFs this month',
          type: 'community' as const,
          category: 'social' as const,
          difficulty: 'hard' as const,
          startDate: new Date(Date.now() - 86400000 * 15).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 15).toISOString(),
          progress: 742,
          target: 1000,
          participants: 89,
          reward: {
            type: 'title' as const,
            value: 'Stockholm Hero',
            description: 'Special title for Stockholm community heroes'
          },
          isParticipating: false,
          isCompleted: false
        }
      ],
      upcoming: [
        {
          id: '3',
          title: 'New Year, New Friendships',
          description: 'Connect with 10 new community members',
          type: 'individual' as const,
          category: 'social' as const,
          difficulty: 'easy' as const,
          startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 21).toISOString(),
          progress: 0,
          target: 10,
          participants: 23,
          maxParticipants: 100,
          reward: {
            type: 'points' as const,
            value: 500,
            description: '500 community points'
          },
          isParticipating: false,
          isCompleted: false
        }
      ],
      completed: [
        {
          id: '4',
          title: 'Holiday Helper',
          description: 'Share holiday decorations with neighbors',
          type: 'individual' as const,
          category: 'sharing' as const,
          difficulty: 'easy' as const,
          startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
          endDate: new Date(Date.now() - 86400000 * 7).toISOString(),
          progress: 8,
          target: 5,
          participants: 234,
          reward: {
            type: 'badge' as const,
            value: '🎄 Holiday Helper',
            description: 'Special holiday badge'
          },
          isParticipating: true,
          isCompleted: true
        }
      ]
    };

    setTimeout(() => {
      setChallenges(mockChallenges);
      setLoading(false);
    }, 1000);
  }, []);

  const handleJoinChallenge = (challengeId: string) => {
    if (!challenges) return;
    
    setChallenges({
      ...challenges,
      active: challenges.active.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, isParticipating: true, participants: challenge.participants + 1 }
          : challenge
      ),
      upcoming: challenges.upcoming.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, isParticipating: true, participants: challenge.participants + 1 }
          : challenge
      )
    });
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
    }
  };

  const getCategoryIcon = (category: Challenge['category']) => {
    switch (category) {
      case 'sharing':
        return <Gift className="h-4 w-4" />;
      case 'social':
        return <Users className="h-4 w-4" />;
      case 'environmental':
        return <Target className="h-4 w-4" />;
      case 'learning':
        return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!challenges) return null;

  const renderChallenge = (challenge: Challenge) => (
    <SlideIn key={challenge.id} direction="up" delay={100}>
      <Card className="p-4 relative overflow-hidden">
        {challenge.isCompleted && (
          <div className="absolute top-0 right-0 bg-green-500 text-white px-2 py-1 text-xs font-medium">
            <CheckCircle className="h-3 w-3 inline mr-1" />
            Completed
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(challenge.category)}
                <h3 className="font-semibold">{challenge.title}</h3>
                <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {challenge.type}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {challenge.participants} participants
                  {challenge.maxParticipants && `/${challenge.maxParticipants}`}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Ends {formatDistanceToNow(new Date(challenge.endDate), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{challenge.progress}/{challenge.target}</span>
            </div>
            <Progress 
              value={(challenge.progress / challenge.target) * 100} 
              className="h-2"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <strong>Reward:</strong> {challenge.reward.description}
            </div>
            
            {!challenge.isCompleted && (
              <Button
                variant={challenge.isParticipating ? "secondary" : "default"}
                size="sm"
                onClick={() => handleJoinChallenge(challenge.id)}
                disabled={challenge.isParticipating}
              >
                {challenge.isParticipating ? "Participating" : "Join Challenge"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </SlideIn>
  );

  return (
    <FadeIn>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-500" />
          Community Challenges
        </h2>
        
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active ({challenges.active.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({challenges.upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({challenges.completed.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            <div className="space-y-4">
              {challenges.active.map(renderChallenge)}
            </div>
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-6">
            <div className="space-y-4">
              {challenges.upcoming.map(renderChallenge)}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {challenges.completed.map(renderChallenge)}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </FadeIn>
  );
}
