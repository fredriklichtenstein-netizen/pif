
import { useState } from 'react';
import { MainHeader } from '@/components/layout/MainHeader';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EnhancedConversationView } from '@/components/messaging/EnhancedConversationView';
import { Search, Plus, Filter, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  recipientName: string;
  recipientAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  itemTitle?: string;
}

export default function EnhancedMessages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'archived'>('all');

  // Mock conversations data
  const conversations: Conversation[] = [
    {
      id: '1',
      recipientName: 'Emma Andersson',
      lastMessage: 'Perfect! I can pick it up this weekend.',
      lastMessageTime: new Date(Date.now() - 300000).toISOString(),
      unreadCount: 2,
      isOnline: true,
      itemTitle: 'Vintage Camera'
    },
    {
      id: '2',
      recipientName: 'Lars Nilsson',
      lastMessage: 'Thanks for the books! My daughter loves them.',
      lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 0,
      isOnline: false,
      itemTitle: 'Children\'s Books'
    },
    {
      id: '3',
      recipientName: 'Maria Santos',
      lastMessage: 'Is the desk still available?',
      lastMessageTime: new Date(Date.now() - 7200000).toISOString(),
      unreadCount: 1,
      isOnline: true,
      itemTitle: 'Office Desk'
    }
  ];

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.itemTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filterType) {
      case 'unread':
        return matchesSearch && conv.unreadCount > 0;
      case 'archived':
        return matchesSearch && false; // No archived conversations in mock data
      default:
        return matchesSearch;
    }
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="container mx-auto px-4 py-6" role="main">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations Sidebar */}
            <div className={`lg:col-span-4 ${selectedConversation ? 'hidden lg:block' : 'block'}`}>
              <Card className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Messages
                    </h2>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex gap-2">
                    <Button
                      variant={filterType === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterType === 'unread' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('unread')}
                      className="gap-1"
                    >
                      <Filter className="h-3 w-3" />
                      Unread
                    </Button>
                  </div>
                </div>
                
                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations found</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.recipientAvatar} />
                              <AvatarFallback>{conversation.recipientName[0]}</AvatarFallback>
                            </Avatar>
                            {conversation.isOnline && (
                              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-sm truncate">
                                {conversation.recipientName}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs px-2 py-0">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {conversation.itemTitle && (
                              <div className="mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {conversation.itemTitle}
                                </Badge>
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
            
            {/* Conversation View */}
            <div className={`lg:col-span-8 ${selectedConversation ? 'block' : 'hidden lg:block'}`}>
              {selectedConv ? (
                <EnhancedConversationView
                  conversationId={selectedConv.id}
                  recipientName={selectedConv.recipientName}
                  recipientAvatar={selectedConv.recipientAvatar}
                  onBack={() => setSelectedConversation(null)}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                    <p>Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
