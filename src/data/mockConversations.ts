
import type { Conversation } from "@/types/messaging";
import { DEMO_USER } from "./mockUser";

/**
 * Mock conversations for demo mode
 */
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "mock-conv-1",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    item_id: 1,
    last_message_text: "Hej! Är bokhyllan fortfarande tillgänglig?",
    participants: [
      {
        id: "mock-participant-1",
        user_id: DEMO_USER.id,
        conversation_id: "mock-conv-1",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        last_read_at: new Date().toISOString(),
        profile: {
          id: DEMO_USER.id,
          username: "Demo User",
          avatar_url: DEMO_USER.user_metadata?.avatar_url || null,
        },
      },
      {
        id: "mock-participant-2",
        user_id: "mock-user-1",
        conversation_id: "mock-conv-1",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        last_read_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        profile: {
          id: "mock-user-1",
          username: "Anna S.",
          avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        },
      },
    ],
    item: {
      id: "mock-1",
      title: "Vintage wooden bookshelf",
      description: "Beautiful solid oak bookshelf in great condition.",
      category: "Furniture",
      condition: "Good",
      measurements: {},
      images: ["https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop"],
      location: "Södermalm, Stockholm",
      coordinates: { lng: 18.073, lat: 59.318 },
      postedBy: {
        id: "mock-user-1",
        name: "Anna S.",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "active",
      likesCount: 5,
      interestsCount: 3,
      commentsCount: 2,
    },
  },
  {
    id: "mock-conv-2",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    item_id: 3,
    last_message_text: "Tack så mycket! Min dotter kommer älska dessa leksaker.",
    participants: [
      {
        id: "mock-participant-3",
        user_id: DEMO_USER.id,
        conversation_id: "mock-conv-2",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        last_read_at: new Date().toISOString(),
        profile: {
          id: DEMO_USER.id,
          username: "Demo User",
          avatar_url: DEMO_USER.user_metadata?.avatar_url || null,
        },
      },
      {
        id: "mock-participant-4",
        user_id: "mock-user-3",
        conversation_id: "mock-conv-2",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        last_read_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        profile: {
          id: "mock-user-3",
          username: "Maria K.",
          avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        },
      },
    ],
    item: {
      id: "mock-3",
      title: "Children's toys bundle",
      description: "A collection of toys suitable for ages 3-6.",
      category: "Toys",
      condition: "Good",
      measurements: {},
      images: ["https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop"],
      location: "Vasastan, Stockholm",
      coordinates: { lng: 18.055, lat: 59.345 },
      postedBy: {
        id: "mock-user-3",
        name: "Maria K.",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      },
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      status: "active",
      likesCount: 3,
      interestsCount: 2,
      commentsCount: 1,
    },
  },
];

/**
 * Mock messages for demo conversations
 */
export const MOCK_MESSAGES: Record<string, Array<{
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}>> = {
  "mock-conv-1": [
    {
      id: "mock-msg-1",
      conversation_id: "mock-conv-1",
      sender_id: DEMO_USER.id,
      content: "Hej! Jag såg din bokhylla och den ser fantastisk ut. Är den fortfarande tillgänglig?",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-msg-2",
      conversation_id: "mock-conv-1",
      sender_id: "mock-user-1",
      content: "Hej! Ja, den är fortfarande tillgänglig. Den är i mycket bra skick!",
      created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-msg-3",
      conversation_id: "mock-conv-1",
      sender_id: DEMO_USER.id,
      content: "Underbart! Kan jag komma förbi och titta på den imorgon?",
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-msg-4",
      conversation_id: "mock-conv-1",
      sender_id: "mock-user-1",
      content: "Absolut! Vilken tid passar dig? Jag är hemma efter kl 17.",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read_at: null,
    },
  ],
  "mock-conv-2": [
    {
      id: "mock-msg-5",
      conversation_id: "mock-conv-2",
      sender_id: DEMO_USER.id,
      content: "Hej! Jag är intresserad av leksakerna för min dotter. Finns alla pusselbitar kvar?",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-msg-6",
      conversation_id: "mock-conv-2",
      sender_id: "mock-user-3",
      content: "Hej! Ja, alla pusselbitarna är kvar. Jag har dubbelkollat!",
      created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-msg-7",
      conversation_id: "mock-conv-2",
      sender_id: DEMO_USER.id,
      content: "Perfekt! Kan jag hämta dem i helgen?",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-msg-8",
      conversation_id: "mock-conv-2",
      sender_id: "mock-user-3",
      content: "Självklart! Jag skickar adressen. Tack så mycket! Min dotter kommer älska dessa leksaker.",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      read_at: null,
    },
  ],
};
