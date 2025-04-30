
import { Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PrivateRoute } from "@/components/auth/PrivateRoute";

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-gray-500">Loading...</p>
  </div>
);

const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
    <p className="text-red-500 font-semibold mb-2">Failed to load the page</p>
    <button 
      onClick={() => window.location.reload()}
      className="mt-2 px-4 py-2 bg-primary text-white rounded"
    >
      Try Again
    </button>
  </div>
);

const enhancedLazy = (importFn: () => Promise<any>) => {
  return lazy(() => 
    importFn()
      .catch(error => {
        console.error("Failed to load component:", error);
        return { default: ErrorFallback };
      })
  );
};

const Home = enhancedLazy(() => import("@/pages/Home"));
const Map = enhancedLazy(() => import("@/pages/Map"));
const Messages = enhancedLazy(() => import("@/pages/Messages"));
const Post = enhancedLazy(() => import("@/pages/Post"));
const Profile = enhancedLazy(() => import("@/pages/Profile"));
const Feed = enhancedLazy(() => import("@/pages/Feed"));
const AccountSettings = enhancedLazy(() => import("@/pages/AccountSettings"));
const Auth = enhancedLazy(() => import("@/pages/Auth"));
const EmailConfirmation = enhancedLazy(() => import("@/pages/EmailConfirmation"));
const ResetPassword = enhancedLazy(() => import("@/pages/ResetPassword"));
const CreateProfile = enhancedLazy(() => import("@/pages/CreateProfile"));
const NotFound = enhancedLazy(() => import("@/pages/NotFound"));
const ItemDetail = enhancedLazy(() => import("@/pages/ItemDetail"));
const ShareRedirect = enhancedLazy(() => import("@/pages/ShareRedirect"));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const publicRoutes = [
  { path: "/", element: withSuspense(Home) },
  { path: "/feed", element: withSuspense(Feed) },
  { path: "/map", element: withSuspense(Map) },
  { path: "/auth", element: withSuspense(Auth) },
  { path: "/email-confirmation", element: withSuspense(EmailConfirmation) },
  { path: "/reset-password", element: withSuspense(ResetPassword) },
  { path: "/item/:id", element: withSuspense(ItemDetail) },
  { path: "/share/:id", element: withSuspense(ShareRedirect) }, // New share redirect route
  { path: "*", element: withSuspense(NotFound) },
];

export const privateRoutes = [
  { 
    path: "/messages", 
    element: <PrivateRoute>{withSuspense(Messages)}</PrivateRoute>
  },
  { 
    path: "/post", 
    element: <PrivateRoute>{withSuspense(Post)}</PrivateRoute>
  },
  { 
    path: "/profile", 
    element: <PrivateRoute>{withSuspense(Profile)}</PrivateRoute>
  },
  { 
    path: "/account-settings", 
    element: <PrivateRoute>{withSuspense(AccountSettings)}</PrivateRoute>
  },
  { 
    path: "/create-profile", 
    element: <PrivateRoute>{withSuspense(CreateProfile)}</PrivateRoute>
  },
];
