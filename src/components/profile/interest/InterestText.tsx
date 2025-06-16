
import { Heart } from "lucide-react";

interface InterestTextProps {
  users: any[];
}

export function InterestText({ users }: InterestTextProps) {
  const getInterestText = () => {
    // Filter out null/undefined users and users without valid data
    const validUsers = users.filter(user => user && user.users && user.users.first_name);
    
    if (validUsers.length === 0) return "";
    
    if (validUsers.length === 1) {
      return `${validUsers[0].users.first_name || 'Someone'} is interested`;
    }
    if (validUsers.length === 2) {
      return `${validUsers[0].users.first_name || 'Someone'} and ${validUsers[1].users.first_name || 'someone else'} are interested`;
    }
    return `${validUsers[0].users.first_name || 'Someone'} and ${validUsers.length - 1} others are interested`;
  };

  const interestText = getInterestText();
  
  // Don't render anything if there's no valid interest text
  if (!interestText) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mt-2">
      <Heart className="h-5 w-5 text-primary fill-primary" />
      <span className="hover:underline">{interestText}</span>
    </div>
  );
}
