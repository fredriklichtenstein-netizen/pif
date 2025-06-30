
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Quote } from 'lucide-react';
import { FadeIn } from '@/components/animation/FadeIn';
import { SlideIn } from '@/components/animation/SlideIn';
import { formatDistanceToNow } from 'date-fns';

interface PIFStory {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    location: string;
  };
  recipient?: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: 'heartwarming' | 'helpful' | 'creative' | 'community';
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  images?: string[];
  tags: string[];
}

export function PIFStories() {
  const [stories, setStories] = useState<PIFStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock stories data
    const mockStories: PIFStory[] = [
      {
        id: '1',
        title: 'A Camera That Changed Everything',
        content: 'I was hesitant to give away my old camera, thinking no one would want it. But Emma reached out and told me she was starting a photography course but couldn\'t afford equipment. Three months later, she shared her first exhibition photos with me. Sometimes the things we think are worthless become treasures in someone else\'s hands. The PIF community showed me that sharing isn\'t just about objects - it\'s about enabling dreams.',
        author: {
          id: 'u1',
          name: 'Lars Nilsson',
          location: 'Stockholm'
        },
        recipient: {
          id: 'u2',
          name: 'Emma Andersson'
        },
        category: 'heartwarming',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        likes: 47,
        comments: 12,
        isLiked: false,
        tags: ['photography', 'dreams', 'education']
      },
      {
        id: '2',
        title: 'The Furniture That Built a Home',
        content: 'Moving to Sweden as a student meant starting with nothing. When I posted about needing basic furniture, the response was overwhelming. Maria gave me a dining table, Johan provided chairs, and Anna shared her extra bookshelf. What meant the most wasn\'t just the furniture - it was the welcoming spirit of my new community. Each piece came with a story and a smile. Now, two years later, I\'m the one giving away items to new students. The circle continues.',
        author: {
          id: 'u3',
          name: 'Ahmed Hassan',
          location: 'Uppsala'
        },
        category: 'community',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        likes: 68,
        comments: 23,
        isLiked: true,
        tags: ['student', 'community', 'welcome']
      },
      {
        id: '3',
        title: 'Books That Opened Minds',
        content: 'My children had outgrown their picture books, and I almost threw them away. Then I remembered PIF. A local daycare reached out - they needed diverse books for their international program. Seeing those same books spark joy in new little hands reminded me why we read to our kids in the first place. The daycare teacher sent me photos of story time, and I realized these books are still making magic, just for different children now.',
        author: {
          id: 'u4',
          name: 'Astrid Lindgren',
          location: 'Göteborg'
        },
        category: 'helpful',
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        likes: 34,
        comments: 8,
        isLiked: false,
        tags: ['books', 'children', 'education', 'daycare']
      }
    ];

    setTimeout(() => {
      setStories(mockStories);
      setLoading(false);
    }, 1200);
  }, []);

  const handleLike = (storyId: string) => {
    setStories(stories.map(story =>
      story.id === storyId
        ? {
            ...story,
            isLiked: !story.isLiked,
            likes: story.isLiked ? story.likes - 1 : story.likes + 1
          }
        : story
    ));
  };

  const getCategoryColor = (category: PIFStory['category']) => {
    switch (category) {
      case 'heartwarming':
        return 'bg-pink-100 text-pink-700';
      case 'helpful':
        return 'bg-blue-100 text-blue-700';
      case 'creative':
        return 'bg-purple-100 text-purple-700';
      case 'community':
        return 'bg-green-100 text-green-700';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">PIF Stories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Real stories from our community members about how sharing and receiving 
            has made a difference in their lives.
          </p>
        </div>
      </FadeIn>

      <div className="space-y-6">
        {stories.map((story, index) => (
          <SlideIn key={story.id} direction="up" delay={index * 200}>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={story.author.avatar} />
                      <AvatarFallback>{story.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{story.author.name}</h3>
                      <p className="text-sm text-gray-500">{story.author.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(story.category)}>
                      {story.category}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Story Title */}
                <h2 className="text-xl font-semibold text-gray-900">{story.title}</h2>

                {/* Story Content */}
                <div className="relative">
                  <Quote className="absolute -left-2 -top-2 h-8 w-8 text-gray-200" />
                  <p className="text-gray-700 leading-relaxed pl-6 italic">
                    {story.content}
                  </p>
                </div>

                {/* Recipient */}
                {story.recipient && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <span>Shared with:</span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={story.recipient.avatar} />
                      <AvatarFallback className="text-xs">{story.recipient.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{story.recipient.name}</span>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {story.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(story.id)}
                      className={`gap-2 ${story.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      <Heart className={`h-4 w-4 ${story.isLiked ? 'fill-current' : ''}`} />
                      {story.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-gray-500">
                      <MessageCircle className="h-4 w-4" />
                      {story.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-gray-500">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Read More Stories
                  </Button>
                </div>
              </div>
            </Card>
          </SlideIn>
        ))}
      </div>

      {/* Call to Action */}
      <FadeIn>
        <Card className="p-8 text-center bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h3 className="text-xl font-semibold mb-2">Share Your PIF Story</h3>
          <p className="text-gray-600 mb-4 max-w-lg mx-auto">
            Have a meaningful PIF experience? Share your story to inspire others 
            in our community.
          </p>
          <Button className="gap-2">
            <Quote className="h-4 w-4" />
            Share Your Story
          </Button>
        </Card>
      </FadeIn>
    </div>
  );
}
