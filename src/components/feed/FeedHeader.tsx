
interface FeedHeaderProps {}

export function FeedHeader({}: FeedHeaderProps) {
  return (
    <div className="mb-4 mt-4">
      <h1 className="text-2xl font-bold mb-1">PiF Community</h1>
      <p className="text-muted-foreground">Sustainable sharing in your neighborhood</p>
    </div>
  );
}
