import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Star, Zap, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  category: "posts" | "interactions" | "community" | "milestones";
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface UserStats {
  totalPifs: number;
  completedPifs: number;
  likesReceived: number;
  commentsGiven: number;
  userRating: number;
  joinDate: string;
  level: number;
  totalPoints: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  points: number;
  level: number;
  badge: string;
}

export const GamificationHub = () => {
  const { user } = useGlobalAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchAchievements();
      fetchLeaderboard();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch user's items and stats
      const { data: items } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id);

      const { data: interests } = await supabase
        .from("interests")
        .select("*")
        .eq("user_id", user.id);

      const { data: likes } = await supabase
        .from("likes")
        .select("item_id, items!inner(*)")
        .eq("items.user_id", user.id);

      const { data: comments } = await supabase
        .from("comments")
        .select("*")
        .eq("user_id", user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const totalPifs = items?.length || 0;
      const completedPifs = items?.filter(item => item.pif_status === "completed").length || 0;
      const likesReceived = likes?.length || 0;
      const commentsGiven = comments?.length || 0;

      // Calculate level based on points
      const totalPoints = calculateTotalPoints(totalPifs, completedPifs, likesReceived, commentsGiven);
      const level = Math.floor(totalPoints / 100) + 1;

      setUserStats({
        totalPifs,
        completedPifs,
        likesReceived,
        commentsGiven,
        userRating: 4.5, // Placeholder
        joinDate: profile?.created_at || new Date().toISOString(),
        level,
        totalPoints
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const calculateTotalPoints = (posts: number, completed: number, likes: number, comments: number) => {
    return (posts * 10) + (completed * 50) + (likes * 5) + (comments * 2);
  };

  const fetchAchievements = async () => {
    if (!userStats) return;

    const achievements: Achievement[] = [
      {
        id: "first_pif",
        title: "First PIF",
        description: "Post your first PIF",
        icon: <Star className="h-6 w-6" />,
        points: 50,
        category: "posts",
        unlocked: userStats.totalPifs >= 1,
        progress: Math.min(userStats.totalPifs, 1),
        maxProgress: 1
      },
      {
        id: "prolific_piffer",
        title: "Prolific PIFfer",
        description: "Post 10 PIFs",
        icon: <Zap className="h-6 w-6" />,
        points: 100,
        category: "posts",
        unlocked: userStats.totalPifs >= 10,
        progress: Math.min(userStats.totalPifs, 10),
        maxProgress: 10
      },
      {
        id: "completion_master",
        title: "Completion Master",
        description: "Complete 5 PIFs",
        icon: <Trophy className="h-6 w-6" />,
        points: 200,
        category: "milestones",
        unlocked: userStats.completedPifs >= 5,
        progress: Math.min(userStats.completedPifs, 5),
        maxProgress: 5
      },
      {
        id: "community_favorite",
        title: "Community Favorite",
        description: "Receive 25 likes",
        icon: <Users className="h-6 w-6" />,
        points: 150,
        category: "interactions",
        unlocked: userStats.likesReceived >= 25,
        progress: Math.min(userStats.likesReceived, 25),
        maxProgress: 25
      },
      {
        id: "conversation_starter",
        title: "Conversation Starter",
        description: "Leave 20 comments",
        icon: <Award className="h-6 w-6" />,
        points: 100,
        category: "community",
        unlocked: userStats.commentsGiven >= 20,
        progress: Math.min(userStats.commentsGiven, 20),
        maxProgress: 20
      }
    ];

    setAchievements(achievements);
  };

  const fetchLeaderboard = async () => {
    try {
      // Simulate leaderboard data - in real app would aggregate from user stats
      const mockLeaderboard: LeaderboardEntry[] = [
        {
          rank: 1,
          userId: "user1",
          username: "Anna S",
          avatarUrl: "",
          points: 1250,
          level: 13,
          badge: "PIF Master"
        },
        {
          rank: 2,
          userId: "user2",
          username: "Erik L",
          avatarUrl: "",
          points: 980,
          level: 10,
          badge: "Community Hero"
        },
        {
          rank: 3,
          userId: "user3",
          username: "Maria K",
          avatarUrl: "",
          points: 765,
          level: 8,
          badge: "Active PIFfer"
        }
      ];

      if (userStats) {
        const userEntry: LeaderboardEntry = {
          rank: 15,
          userId: user?.id || "",
          username: "You",
          avatarUrl: "",
          points: userStats.totalPoints,
          level: userStats.level,
          badge: getBadgeForLevel(userStats.level)
        };
        mockLeaderboard.push(userEntry);
      }

      setLeaderboard(mockLeaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeForLevel = (level: number): string => {
    if (level >= 15) return "PIF Master";
    if (level >= 10) return "Community Hero";
    if (level >= 5) return "Active PIFfer";
    return "Newcomer";
  };

  useEffect(() => {
    if (userStats) {
      fetchAchievements();
      fetchLeaderboard();
    }
  }, [userStats]);

  if (loading || !userStats) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Your PIF Journey</h1>
        <p className="text-gray-600">Track your progress and achievements in the PIF community</p>
      </div>

      {/* User Level and Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Level {userStats.level} - {getBadgeForLevel(userStats.level)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to Level {userStats.level + 1}</span>
                <span>{userStats.totalPoints % 100}/100 points</span>
              </div>
              <Progress value={(userStats.totalPoints % 100)} className="h-3" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{userStats.totalPifs}</div>
                <div className="text-sm text-gray-600">Total PIFs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{userStats.completedPifs}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{userStats.likesReceived}</div>
                <div className="text-sm text-gray-600">Likes Received</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{userStats.totalPoints}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(achievement => (
              <Card key={achievement.id} className={achievement.unlocked ? "border-green-200 bg-green-50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${achievement.unlocked ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.title}</CardTitle>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                    <Badge variant={achievement.unlocked ? "default" : "secondary"}>
                      {achievement.points} pts
                    </Badge>
                  </div>
                </CardHeader>
                {!achievement.unlocked && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map(entry => (
                  <div key={entry.userId} className={`flex items-center justify-between p-3 rounded-lg border ${entry.username === "You" ? "bg-blue-50 border-blue-200" : "bg-white"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${entry.rank <= 3 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>
                        {entry.rank <= 3 ? (
                          <Trophy className="h-4 w-4" />
                        ) : (
                          entry.rank
                        )}
                      </div>
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {entry.avatarUrl ? (
                          <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold">{entry.username[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{entry.username}</div>
                        <div className="text-sm text-gray-600">{entry.badge}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{entry.points} pts</div>
                      <div className="text-sm text-gray-600">Level {entry.level}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};