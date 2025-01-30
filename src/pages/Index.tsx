import { ItemCard } from "@/components/ItemCard";
import { MainNav } from "@/components/MainNav";

// Temporary mock data
const items = [
  {
    id: "1",
    title: "Vintage Denim Jacket",
    description: "Size M, great condition, perfect for spring!",
    image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800",
    location: "2.5 km away",
    category: "Clothing",
    postedBy: {
      name: "Sarah K.",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
  },
  {
    id: "2",
    title: "Wooden Bookshelf",
    description: "Sturdy bookshelf, perfect for small spaces",
    image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800",
    location: "1.2 km away",
    category: "Furniture",
    postedBy: {
      name: "Mike R.",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm py-4 px-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-primary">Community Thrift</h1>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} {...item} />
          ))}
        </div>
      </main>

      <MainNav />
    </div>
  );
};

export default Index;