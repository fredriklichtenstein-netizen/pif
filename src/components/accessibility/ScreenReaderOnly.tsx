
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export function ScreenReaderOnly({ children }: ScreenReaderOnlyProps) {
  return (
    <div className="sr-only">
      {children}
    </div>
  );
}
