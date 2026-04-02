
import { LanguageSelector } from "@/components/common/LanguageSelector";

export function MainHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-end">
        <LanguageSelector />
      </div>
    </header>
  );
}
