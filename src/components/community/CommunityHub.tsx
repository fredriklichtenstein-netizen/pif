import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Trophy, 
  Heart, 
  Star, 
  MapPin,
  Calendar,
  Target,
  Gift,
  Award,
  Zap,
  TrendingUp,
  BookOpen
} from "lucide-react";

interface CommunityMember {
  id: string;
  username: string;
  avatar?: string;
  location: string;
  pifCount: number;
  rating: number;
  badges: string[];
  recentActivity: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'seasonal';
  participants: number;
  reward: string;
  progress: number;
  endDate: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Story {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  date: string;
  likes: number;
  category: 'success' | 'gratitude' | 'impact';
}

export const CommunityHub = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const communityMembers: CommunityMember[] = [
    {
      id: '1',
      username: 'anna_k',
      location: 'Stockholm',
      pifCount: 47,
      rating: 4.9,
      badges: ['Veteran Piffer', 'Community Hero'],
      recentActivity: 'Shared a bicycle 2 hours ago'
    },
    {
      id: '2',
      username: 'erik_m',
      location: 'Gothenburg',
      pifCount: 23,
      rating: 4.7,
      badges: ['Rising Star'],
      recentActivity: 'Completed a PIF challenge'
    },
    {
      id: '3',
      username: 'lisa_j',
      location: 'Malmö',
      pifCount: 31,
      rating: 4.8,
      badges: ['Sustainability Champion', 'Local Legend'],
      recentActivity: 'Posted kitchen utensils'
    }
  ];

  const challenges: Challenge[] = [
    {
      id: '1',
      title: 'Winter Warmth Challenge',
      description: 'Share warm clothing items to help others stay cozy this winter',
      type: 'monthly',
      participants: 156,
      reward: 'Winter Helper badge',
      progress: 67,
      endDate: '2024-01-31',
      difficulty: 'easy'
    },
    {
      id: '2',
      title: 'Book Lovers Unite',
      description: 'Share 5 books within the community this month',
      type: 'monthly',
      participants: 89,
      reward: '100 community points',
      progress: 34,
      endDate: '2024-01-31',
      difficulty: 'medium'
    },
    {
      id: '3',
      title: 'Green Living Week',
      description: 'Focus on eco-friendly PIFs - plants, sustainable items, etc.',
      type: 'weekly',
      participants: 234,
      reward: 'Eco Warrior badge',
      progress: 78,
      endDate: '2024-01-21',
      difficulty: 'easy'
    }
  ];

  const stories: Story[] = [
    {
      id: '1',
      title: 'How PIF Changed My Perspective on Community',
      content: 'I started using PIF to declutter my home, but I found so much more. The connections I\'ve made and the gratitude I\'ve received from helping others has been incredible...',
      author: 'Maria S.',
      date: '2024-01-10',
      likes: 47,
      category: 'gratitude'
    },
    {
      id: '2',
      title: 'From Stranger to Friend: A PIF Success Story',
      content: 'When I offered my old guitar through PIF, I never expected to make a lifelong friend. The person who received it invited me to join their band...',
      author: 'Johan L.',
      date: '2024-01-08',
      likes: 73,
      category: 'success'
    },
    {
      id: '3',
      title: 'Small Acts, Big Impact',
      content: 'Sharing my extra vegetables from my garden seemed like such a small thing, but the thank you note I received showed me how much it meant to a struggling family...',
      author: 'Ingrid P.',
      date: '2024-01-05',
      likes: 92,
      category: 'impact'
    }
  ];

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: Story['category']) => {
    switch (category) {
      case 'success':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'gratitude':
        return <Heart className="h-4 w-4 text-red-600" />;
      case 'impact':
        return <Zap className="h-4 w-4 text-blue-600" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Community Hub</h1>
        <p className="text-gray-600">Discover amazing people, join challenges, and share stories</p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">1,247</p>
                <p className="text-sm text-gray-600">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">3,842</p>
                <p className="text-sm text-gray-600">PIFs Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">12</p>
                <p className="text-sm text-gray-600">Active Challenges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">94%</p>
                <p className="text-sm text-gray-600">Satisfaction Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="discovery" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search community members by name, location, or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Community Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {communityMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">@{member.username}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600">{member.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {member.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {member.pifCount} PIFs
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{member.recentActivity}</p>
                      <div className="flex gap-1 mt-2">
                        {member.badges.map((badge, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        {challenge.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                    </div>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{challenge.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Ends {challenge.endDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span>{challenge.reward}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{challenge.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all" 
                        style={{ width: `${challenge.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    Join Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stories" className="space-y-4">
          <div className="grid gap-4">
            {stories.map((story) => (
              <Card key={story.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {getCategoryIcon(story.category)}
                        {story.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>by {story.author}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {story.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {story.likes} likes
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {story.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{story.content}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm">
                      Read More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="border-dashed border-2 hover:border-solid transition-colors">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Share Your Story</h3>
              <p className="text-gray-600 mb-4">
                Have an inspiring PIF experience? Share it with the community!
              </p>
              <Button>
                Write a Story
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};