
interface ItemContentProps {
  title: string;
  description: string;
  condition?: string;
}

export function ItemContent({
  title,
  description,
  condition,
}: ItemContentProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg leading-tight">{title}</h3>
      
      {condition && (
        <div className="flex items-center text-sm">
          <span className="text-gray-600 font-medium mr-2">Condition:</span>
          <span className="text-gray-900">{condition}</span>
        </div>
      )}
      
      <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
    </div>
  );
}
