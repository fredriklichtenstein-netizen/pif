
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyProps {
  fallback?: React.ReactNode;
}

export function withLazySuspense<P extends object>(
  Component: React.ComponentType<P>,
  options: LazyProps = {}
) {
  const LazyComponent = React.lazy(() => 
    Promise.resolve({ default: Component })
      .catch(error => {
        console.error("Error loading component:", error);
        return { 
          default: (props: any) => (
            <div className="p-4 text-center">
              <p className="text-red-500">Failed to load component</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-primary text-white rounded"
              >
                Try Again
              </button>
            </div>
          ) 
        };
      })
  );

  return function WithSuspense(props: P) {
    return (
      <Suspense fallback={options.fallback || <DefaultFallback />}>
        <LazyComponent {...props as any} />
      </Suspense>
    );
  };
}

function DefaultFallback() {
  return <Skeleton className="w-full h-[70vh]" />;
}

export function lazyImport<
  T extends React.ComponentType<any>,
  I extends { [K2 in K]: T },
  K extends keyof I
>(factory: () => Promise<I>, name: K) {
  return React.lazy(() => 
    factory()
      .then((module) => ({ default: module[name] as unknown as React.ComponentType<any> }))
      .catch(error => {
        console.error(`Error loading module ${String(name)}:`, error);
        return { 
          default: ((props: any) => (
            <div className="p-4 text-center">
              <p className="text-red-500">Failed to load {String(name)}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-primary text-white rounded"
              >
                Try Again
              </button>
            </div>
          )) as unknown as React.ComponentType<any>
        };
      })
  );
}
