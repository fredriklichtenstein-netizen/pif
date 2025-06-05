
interface PostFormHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  condition?: string;
  onTitleChange?: (title: string) => void;
  onCategoryChange?: (category: string) => void;
  onConditionChange?: (condition: string) => void;
}

export function PostFormHeader({ 
  title, 
  subtitle,
  category,
  condition,
  onTitleChange,
  onCategoryChange,
  onConditionChange 
}: PostFormHeaderProps) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      {subtitle && (
        <p className="text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
