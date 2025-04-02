
import { useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { useToast } from "@/hooks/use-toast";
import { AuthStatus } from "@/components/auth/AuthStatus";

export default function Index() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  
  // Placeholder items data
  const items = [
    {
      id: "1",
      title: "Vintage Chair",
      description: "A beautiful vintage chair in great condition.",
      image: "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=2574&auto=format&fit=crop",
      images: ["https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=2574&auto=format&fit=crop"],
      location: "Stockholm",
      coordinates: {
        lat: 59.334591,
        lng: 18.063240
      },
      category: "furniture",
      condition: "good",
      postedBy: {
        name: "Anna L",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg"
      }
    },
    {
      id: "2",
      title: "Coffee Table",
      description: "Wooden coffee table, some minor scratches but sturdy.",
      image: "https://images.unsplash.com/photo-1565191999001-c2a4e5a71b7a?q=80&w=2574&auto=format&fit=crop",
      images: ["https://images.unsplash.com/photo-1565191999001-c2a4e5a71b7a?q=80&w=2574&auto=format&fit=crop"],
      location: "Uppsala",
      coordinates: {
        lat: 59.858562,
        lng: 17.638927
      },
      category: "furniture",
      condition: "used",
      postedBy: {
        name: "Johan K",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg"
      }
    },
    {
      id: "3",
      title: "Bookshelf",
      description: "IKEA bookshelf, 3 years old but in good condition.",
      image: "https://images.unsplash.com/photo-1588279102920-d50c358b3618?q=80&w=2574&auto=format&fit=crop",
      images: ["https://images.unsplash.com/photo-1588279102920-d50c358b3618?q=80&w=2574&auto=format&fit=crop"],
      location: "Stockholm",
      coordinates: {
        lat: 59.329323,
        lng: 18.068581
      },
      category: "furniture",
      condition: "good",
      postedBy: {
        name: "Maria S",
        avatar: "https://randomuser.me/api/portraits/women/22.jpg"
      }
    }
  ];

  const filteredItems = items.filter(item => {
    if (filter === "all") return true;
    // Add other filter logic here
    return item.category === filter;
  });

  return (
    <div className="container max-w-md mx-auto px-4 py-8 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">PIF Community</h1>
          <p className="text-sm text-gray-500">Sustainable sharing in your neighborhood</p>
        </div>
        <AuthStatus showName={false} />
      </div>

      {/* Category filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('all')}
        >
          All Items
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'furniture' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('furniture')}
        >
          Furniture
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'electronics' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('electronics')}
        >
          Electronics
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'clothing' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('clothing')}
        >
          Clothing
        </button>
        <button 
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filter === 'books' ? 'bg-primary text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('books')}
        >
          Books
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-6">
        {filteredItems.map(item => (
          <ItemCard 
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            image={item.image}
            images={item.images}
            location={item.location}
            coordinates={item.coordinates}
            category={item.category}
            condition={item.condition}
            postedBy={item.postedBy}
            onShare={() => {
              toast({
                title: "Shared!",
                description: "Item has been shared with your contacts."
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}
