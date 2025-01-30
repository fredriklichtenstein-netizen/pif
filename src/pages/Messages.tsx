import { MessageSquare } from "lucide-react";

const Messages = () => {
  return (
    <div className="container mx-auto px-4 pb-20 pt-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <div className="space-y-4">
        <div className="p-4 text-center text-gray-500">
          <MessageSquare className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No messages yet</p>
        </div>
      </div>
    </div>
  );
};

export default Messages;