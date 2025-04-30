
import { ReactNode } from "react";
import { NetworkStatus } from "@/components/common/NetworkStatus";

interface NetworkStatusWrapperProps {
  children: ReactNode;
  onRetry?: () => void;
  className?: string;
}

export function NetworkStatusWrapper({ children, onRetry, className }: NetworkStatusWrapperProps) {
  return (
    <div className={`w-full ${className || ''}`}>
      <NetworkStatus onRetry={onRetry} />
      {children}
    </div>
  );
}
