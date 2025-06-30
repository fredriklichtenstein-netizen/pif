
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface AchievementCardProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
}

export function AchievementCard({ achievement, size = 'medium' }: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const progressPercent = achievement.progress && achievement.target 
    ? (achievement.progress / achievement.target) * 100 
    : 0;

  const rarityColors = {
    common: 'bg-gray-100 text-gray-700 border-gray-200',
    rare: 'bg-blue-100 text-blue-700 border-blue-200',
    epic: 'bg-purple-100 text-purple-700 border-purple-200',
    legendary: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200'
  };

  const cardSize = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  return (
    <Card className={`${cardSize[size]} ${rarityColors[achievement.rarity]} relative overflow-hidden transition-all hover:shadow-md`}>
      {achievement.rarity === 'legendary' && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
      )}
      
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-200'}`}>
          {isUnlocked ? (
            <div className="text-2xl">{achievement.icon}</div>
          ) : (
            <Lock className="h-6 w-6 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${size === 'small' ? 'text-sm' : 'text-base'}`}>
              {achievement.title}
            </h3>
            <Badge variant="outline" className="text-xs">
              {achievement.category}
            </Badge>
            {achievement.rarity === 'legendary' && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
          </div>
          
          <p className={`text-gray-600 mb-2 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            {achievement.description}
          </p>
          
          {isUnlocked ? (
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-gray-500">
                Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt!), { addSuffix: true })}
              </span>
            </div>
          ) : achievement.progress !== undefined && achievement.target ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{achievement.progress}/{achievement.target}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Locked
            </Badge>
          )}
          
          {achievement.reward && isUnlocked && (
            <div className="mt-2 text-xs text-green-600">
              Reward: {achievement.reward.type === 'points' ? `${achievement.reward.value} points` : achievement.reward.value}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
