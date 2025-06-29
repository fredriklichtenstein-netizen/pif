
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In a real app, you would send this to your error reporting service
    if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
      const errorData = JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
      
      navigator.sendBeacon('/api/error-report', errorData);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full p-6 text-center">
            <div className="flex justify-center mb-4">
              <Bug className="h-12 w-12 text-destructive" />
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            
            <p className="text-muted-foreground mb-4">
              We encountered an unexpected error. Please try again or refresh the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-2 bg-muted rounded text-xs">
                <summary className="cursor-pointer mb-2 font-medium">Error Details</summary>
                <pre className="whitespace-pre-wrap break-words">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleRetry} variant="outline">
                Try Again
              </Button>
              <Button onClick={this.handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
