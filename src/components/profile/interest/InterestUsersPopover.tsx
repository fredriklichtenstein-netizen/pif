
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InterestText } from "./InterestText";
import { InterestPopoverContent } from "./InterestPopoverContent";
import { InterestSelectionDialog } from "./InterestSelectionDialog";
import { useInterestSelection } from "@/hooks/interest/useInterestSelection";
import { useInterestUsers } from "@/hooks/interest/useInterestUsers";

interface InterestUsersPopoverProps {
  itemId: number;
  itemOwnerId: string;
}

export function InterestUsersPopover({ itemId, itemOwnerId }: InterestUsersPopoverProps) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const {
    selectedUserId,
    setSelectedUserId,
    confirmDialogOpen,
    setConfirmDialogOpen,
    handleSelectReceiver
  } = useInterestSelection();

  const { users, loading, refetchUsers } = useInterestUsers(itemId);
  
  const isOwner = currentUser === itemOwnerId;

  if (loading || users.length === 0) {
    return null;
  }

  const handleUserSelection = async (userId: number) => {
    setSelectedUserId(userId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmSelection = async () => {
    if (selectedUserId) {
      const success = await handleSelectReceiver(selectedUserId, itemId);
      if (success) {
        refetchUsers();
      }
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button>
            <InterestText users={users} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <InterestPopoverContent
            users={users}
            isOwner={isOwner}
            onSelectUser={handleUserSelection}
          />
        </PopoverContent>
      </Popover>

      <InterestSelectionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmSelection}
      />
    </>
  );
}
