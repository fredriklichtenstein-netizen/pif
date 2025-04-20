
import { ReactNode } from "react";
import { NetworkStatus } from "@/components/common/NetworkStatus";

interface ItemCardWrapperProps {
  children: ReactNode;
  onRetry?: () => void;
}

export function ItemCardWrapper({ children, onRetry }: ItemCardWrapperProps) {
  return (
    <div className="w-full">
      <NetworkStatus onRetry={onRetry} />
      {children}
    </div>
  );
}
