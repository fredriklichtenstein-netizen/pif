
import { ItemHeader } from "../ItemHeader";
import { OwnerActions } from "./OwnerActions";

interface ItemCardBodyProps {
  category: string;
  condition?: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  title: string;
  description: string;
  measurements?: Record<string, string>;
  postedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  isOwner: boolean;
  isDeleting: boolean;
  handleEdit: () => void;
  handleDelete: () => void;
  markAsPiffedAction?: () => void;
}

export function ItemCardBody({
  category,
  condition,
  location,
  coordinates,
  title,
  description,
  measurements,
  postedBy,
  isOwner,
  isDeleting,
  handleEdit,
  handleDelete,
  markAsPiffedAction
}: ItemCardBodyProps) {
  return (
    <div className="p-4">
      <ItemHeader
        category={category}
        condition={condition}
        location={location}
        coordinates={coordinates}
        title={title}
        description={description}
        postedBy={postedBy}
        measurements={measurements}
      />
      
      <OwnerActions 
        isOwner={isOwner}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        isDeleting={isDeleting}
        markAsPiffedAction={markAsPiffedAction}
      />
    </div>
  );
}
