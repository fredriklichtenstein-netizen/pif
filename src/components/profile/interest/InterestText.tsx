
import { Heart } from "lucide-react";

interface InterestTextProps {
  users: any[];
}

export function InterestText({ users }: InterestTextProps) {
  const getInterestText = () => {
    if (users.length === 0) return "";
    if (users.length === 1) {
      return `${users[0].users.first_name || 'Someone'} is interested`;
    }
    if (users.length === 2) {
      return `${users[0].users.first_name || 'Someone'} and ${users[1].users.first_name || 'someone else'} are interested`;
    }
    return `${users[0].users.first_name || 'Someone'} and ${users.length - 1} others are interested`;
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mt-2">
      <Heart className="h-5 w-5 text-primary fill-primary" />
      <span className="hover:underline">{getInterestText()}</span>
    </div>
  );
}
