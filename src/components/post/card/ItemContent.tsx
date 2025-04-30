
interface ItemContentProps {
  title: string;
  description: string;
}

export function ItemContent({ title, description }: ItemContentProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-gray-600 text-sm mb-3">{description}</p>
    </div>
  );
}
