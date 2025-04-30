
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check } from "lucide-react";

interface OwnerActionsProps {
  isOwner: boolean;
  handleEdit: () => void;
  handleDelete: () => void;
  isDeleting: boolean;
  markAsPiffedAction?: () => void;
}

export function OwnerActions({ isOwner, handleEdit, handleDelete, isDeleting, markAsPiffedAction }: OwnerActionsProps) {
  if (!isOwner) return null;
  
  return (
    <div className="mt-4 flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleEdit}
        className="flex items-center gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
      {markAsPiffedAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={markAsPiffedAction}
          className="flex items-center gap-2 ml-auto text-green-600 border-green-200 hover:bg-green-50"
        >
          <Check className="h-4 w-4" />
          Mark as Piffed
        </Button>
      )}
    </div>
  );
}
