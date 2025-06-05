
interface PostFormHeaderProps {
  title: string;
  subtitle?: string;
}

export function PostFormHeader({ title, subtitle }: PostFormHeaderProps) {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      {subtitle && (
        <p className="text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
