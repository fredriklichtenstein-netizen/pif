
interface ItemConditionProps {
  condition: string;
}

export function ItemCondition({ condition }: ItemConditionProps) {
  return (
    <div className="flex items-center gap-1.5 mb-3 border-b border-gray-100 pb-2">
      <span className="font-semibold text-gray-700">Condition:</span>
      <span>{condition}</span>
    </div>
  );
}
