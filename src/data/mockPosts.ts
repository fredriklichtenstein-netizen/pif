
import mockBookshelf from "@/assets/mock/mock-bookshelf.jpg";
import mockBicycle from "@/assets/mock/mock-bicycle.jpg";
import mockMoving from "@/assets/mock/mock-moving.jpg";

// Mock data for offline/demo mode
export const MOCK_POSTS = [
  {
    id: "mock-1",
    title: "Vintage wooden bookshelf",
    description: "Beautiful solid oak bookshelf in great condition. Has some character marks that add to its charm. Perfect for a living room or home office.",
    images: [mockBookshelf],
    location: "Södermalm, Stockholm",
    coordinates: { lng: 18.0686, lat: 59.3142 },
    category: "Furniture",
    condition: "Good",
    item_type: "pif",
    postedBy: {
      id: "mock-user-1",
      name: "Anna S.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    __isMock: true
  },
  {
    id: "mock-2", 
    title: "Looking for a bicycle",
    description: "I'm looking for a bicycle for commuting. Any size works, as long as it's functional. Happy to pick up anywhere in Stockholm!",
    images: [mockBicycle],
    location: "Kungsholmen, Stockholm",
    coordinates: { lng: 18.0259, lat: 59.3326 },
    category: "Sports",
    condition: null,
    item_type: "wish",
    postedBy: {
      id: "mock-user-2",
      name: "Erik L.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    __isMock: true
  },
  {
    id: "mock-3",
    title: "Children's toys bundle",
    description: "A collection of toys suitable for ages 3-6. Includes building blocks, puzzles, and some stuffed animals. All in good condition.",
    images: ["https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop"],
    location: "Vasastan, Stockholm",
    coordinates: { lng: 18.0500, lat: 59.3450 },
    category: "Toys",
    condition: "Good",
    item_type: "pif",
    postedBy: {
      id: "mock-user-3",
      name: "Maria K.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
    },
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    __isMock: true
  },
  {
    id: "mock-4",
    title: "Need help with moving",
    description: "Looking for someone who can help me carry a sofa down 2 flights of stairs this weekend. Will take about 30 minutes. Coffee and snacks provided!",
    images: [mockMoving],
    location: "Östermalm, Stockholm",
    coordinates: { lng: 18.0850, lat: 59.3400 },
    category: "Other",
    condition: null,
    item_type: "wish",
    postedBy: {
      id: "mock-user-4",
      name: "Johan B.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
    },
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    __isMock: true
  },
  {
    id: "mock-5",
    title: "Cozy reading chair",
    description: "Comfortable armchair, perfect for reading. Green velvet fabric, no stains or tears. Pick up only.",
    images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop"],
    location: "Hornstull, Stockholm",
    coordinates: { lng: 18.0340, lat: 59.3150 },
    category: "Furniture",
    condition: "Excellent",
    item_type: "pif",
    postedBy: {
      id: "mock-user-5",
      name: "Lisa A.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
    },
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    __isMock: true
  },
  {
    id: "mock-6",
    title: "Kitchen appliances set",
    description: "Blender, toaster, and coffee maker. All working perfectly. Moving abroad so need to find new homes for these.",
    images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop"],
    location: "Gamla Stan, Stockholm",
    coordinates: { lng: 18.0710, lat: 59.3250 },
    category: "Kitchen",
    condition: "Good",
    item_type: "pif",
    postedBy: {
      id: "mock-user-6",
      name: "Oscar M.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
    },
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    __isMock: true
  }
];
