
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Heart, Gift, MessageCircle, Star, Users, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FadeIn } from '@/components/animation/FadeIn';
import { SlideIn } from '@/components/animation/SlideIn';

interface UserStats {
  totalPifs: number;
  givenPifs: number;
  receivedPifs: number;
  reputation: number;
  joinedDate: string;
  followersCount: number;
  followingCount: number;
  completedPifs: number;
  responseRate: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export function ProfileDashboard() {
  const { session } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demo - in real implementation, fetch from Supabase
  useEffect(() => {
    const mockStats: UserStats = {
      totalPifs: 12,
      givenPifs: 8,
      receivedPifs: 4,
      reputation: 4.8,
      joinedDate: '2024-01-15',
      followersCount: 23,
      followingCount: 15,
      completedPifs: 10,
      responseRate: 95
    };

    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'First Pif',
        description: 'Share your first item with the community',
        icon: '🎉',
        unlockedAt: '2024-01-16'
      },
      {
        id: '2',
        title: 'Generous Heart',
        description: 'Give away 5 items',
        icon: '💝',
        unlockedAt: '2024-02-10'
      },
      {
        id: '3',
        title: 'Community Builder',
        description: 'Help 10 community members',
        icon: '🏗️',
        progress: 8,
        target: 10
      },
      {
        id: '4',
        title: 'Trusted Member',
        description: 'Maintain 4+ star rating',
        icon: '⭐',
        unlockedAt: '2024-03-01'
      }
    ];

    setTimeout(() => {
      setStats(mockStats);
      setAchievements(mockAchievements);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <FadeIn>
        <Card className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session?.user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xl">
                {session?.user?.user_metadata?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {session?.user?.user_metadata?.full_name || 'Community Member'}
                </h1>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Star className="h-3 w-3 mr-1" />
                  {stats.reputation}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(stats.joinedDate).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Local Community
                </span>
              </div>
              
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalPifs}</div>
                  <div className="text-xs text-gray-500">Total PIFs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.followersCount}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.completedPifs}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.responseRate}%</div>
                  <div className="text-xs text-gray-500">Response Rate</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SlideIn direction="up" delay={100}>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.givenPifs}</div>
                <div className="text-sm text-gray-500">Items Given</div>
              </div>
            </div>
          </Card>
        </SlideIn>

        <SlideIn direction="up" delay={200}>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Heart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.receivedPifs}</div>
                <div className="text-sm text-gray-500">Items Received</div>
              </div>
            </div>
          </Card>
        </SlideIn>

        <SlideIn direction="up" delay={300}>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.followingCount}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>
          </Card>
        </SlideIn>

        <SlideIn direction="up" delay={400}>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.reputation}</div>
                <div className="text-sm text-gray-500">Reputation</div>
              </div>
            </div>
          </Card>
        </SlideIn>
      </div>

      {/* Achievements Section */}
      <SlideIn direction="up" delay={500}>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Achievements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border ${
                  achievement.unlockedAt 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    
                    {achievement.unlockedAt ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </Badge>
                    ) : achievement.progress && achievement.target ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{achievement.progress}/{achievement.target}</span>
                          <span>{Math.round((achievement.progress / achievement.target) * 100)}%</span>
                        </div>
                        <Progress value={(achievement.progress / achievement.target) * 100} className="h-2" />
                      </div>
                    ) : (
                      <Badge variant="outline">Locked</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </SlideIn>

      {/* Quick Actions */}
      <SlideIn direction="up" delay={600}>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="default" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Share Something
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Find Community Members
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              View Messages
            </Button>
          </div>
        </Card>
      </SlideIn>
    </div>
  );
}
