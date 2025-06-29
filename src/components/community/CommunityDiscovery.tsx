
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Star, Users, Gift, Heart, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FadeIn } from '@/components/animation/FadeIn';
import { SlideIn } from '@/components/animation/SlideIn';

interface CommunityMember {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  reputation: number;
  totalPifs: number;
  specialties: string[];
  isFollowing: boolean;
  distance: string;
}

interface CommunityStats {
  totalMembers: number;
  activePifs: number;
  completedToday: number;
  topCategories: string[];
}

export function CommunityDiscovery() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('nearby');
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for demo
  useEffect(() => {
    const mockMembers: CommunityMember[] = [
      {
        id: '1',
        name: 'Emma Andersson',
        location: 'Södermalm',
        reputation: 4.9,
        totalPifs: 23,
        specialties: ['Books', 'Electronics'],
        isFollowing: false,
        distance: '0.5 km'
      },
      {
        id: '2',
        name: 'Lars Nilsson',
        location: 'Östermalm',
        reputation: 4.7,
        totalPifs: 15,
        specialties: ['Furniture', 'Tools'],
        isFollowing: true,
        distance: '1.2 km'
      },
      {
        id: '3',
        name: 'Maria Santos',
        location: 'Norrmalm',
        reputation: 4.8,
        totalPifs: 31,
        specialties: ['Clothing', 'Toys'],
        isFollowing: false,
        distance: '2.1 km'
      },
      {
        id: '4',
        name: 'Johan Berg',
        location: 'Vasastan',
        reputation: 4.6,
        totalPifs: 18,
        specialties: ['Sports', 'Music'],
        isFollowing: false,
        distance: '1.8 km'
      }
    ];

    const mockStats: CommunityStats = {
      totalMembers: 1247,
      activePifs: 89,
      completedToday: 12,
      topCategories: ['Electronics', 'Books', 'Clothing', 'Furniture']
    };

    setTimeout(() => {
      setMembers(mockMembers);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  const handleFollow = (memberId: string) => {
    setMembers(members.map(member => 
      member.id === memberId 
        ? { ...member, isFollowing: !member.isFollowing }
        : member
    ));
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Stats Header */}
      <FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats?.totalMembers}</div>
            <div className="text-sm text-gray-500">Community Members</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats?.activePifs}</div>
            <div className="text-sm text-gray-500">Active PIFs</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats?.completedToday}</div>
            <div className="text-sm text-gray-500">Completed Today</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats?.topCategories.length}</div>
            <div className="text-sm text-gray-500">Top Categories</div>
          </Card>
        </div>
      </FadeIn>

      {/* Search and Filters */}
      <SlideIn direction="down" delay={100}>
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </Card>
      </SlideIn>

      {/* Community Tabs */}
      <SlideIn direction="up" delay={200}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
            <TabsTrigger value="active">Most Active</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="nearby" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member, index) => (
                <SlideIn key={member.id} direction="up" delay={index * 100}>
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {member.location} • {member.distance}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {member.reputation}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Gift className="h-4 w-4" />
                          {member.totalPifs} PIFs
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {member.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={member.isFollowing ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleFollow(member.id)}
                          className="flex-1"
                        >
                          {member.isFollowing ? (
                            <>
                              <Users className="h-3 w-3 mr-1" />
                              Following
                            </>
                          ) : (
                            <>
                              <Heart className="h-3 w-3 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </Card>
                </SlideIn>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="text-center py-8 text-gray-500">
              Most active members this week will appear here
            </div>
          </TabsContent>

          <TabsContent value="following" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.filter(member => member.isFollowing).map((member, index) => (
                <SlideIn key={member.id} direction="up" delay={index * 100}>
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.location}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View Recent Activity
                    </Button>
                  </Card>
                </SlideIn>
              ))}
              {filteredMembers.filter(member => member.isFollowing).length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  You're not following anyone yet. Start by exploring nearby members!
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SlideIn>
    </div>
  );
}
