
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import type { User } from '@/hooks/item/useItemInteractions';

interface UserPopoverContentProps {
  type: "like" | "interest";
  users: User[];
  loading: boolean;
  setShowPopup: (show: boolean) => void;
}

export function UserPopoverContent({ type, users, loading, setShowPopup }: UserPopoverContentProps) {
  const navigate = useNavigate();
  
  const handleUserClick = (userId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
    setShowPopup(false);
  };

  const renderUserRow = (user: User) => {
    const truncated = user.name.split(" ");
    const display = truncated.length > 1 
      ? `${truncated[0]} ${truncated[1].charAt(0).toUpperCase()}` 
      : user.name;
    
    return (
      <button 
        key={user.id} 
        className="flex gap-2 items-center w-full py-1 px-2 hover:bg-accent rounded cursor-pointer" 
        onClick={handleUserClick(user.id)}
      >
        <Avatar className="h-6 w-6">
          <img src={user.avatar} alt={user.name} />
        </Avatar>
        <span className="text-sm">{display}</span>
      </button>
    );
  };

  return (
    <>
      <div className="font-medium text-base mb-2">
        {type === "like" ? "Liked by" : "Interested"}
      </div>
      {loading ? (
        <div className="text-sm text-gray-400 py-2">Loading...</div>
      ) : users.length > 0 ? (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {users.map(renderUserRow)}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-2">No users yet</div>
      )}
    </>
  );
}
