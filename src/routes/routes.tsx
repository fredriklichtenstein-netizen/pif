
import { Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PrivateRoute } from "@/components/auth/PrivateRoute";

// Lazy load components
const Index = lazy(() => import("@/pages/Index"));
const Map = lazy(() => import("@/pages/Map"));
const Messages = lazy(() => import("@/pages/Messages"));
const Post = lazy(() => import("@/pages/Post"));
const Profile = lazy(() => import("@/pages/Profile"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const Auth = lazy(() => import("@/pages/Auth"));
const EmailConfirmation = lazy(() => import("@/pages/EmailConfirmation"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const CreateProfile = lazy(() => import("@/pages/CreateProfile"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Wrap component with suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const publicRoutes = [
  { path: "/", element: withSuspense(Index) },
  { path: "/map", element: withSuspense(Map) },
  { path: "/auth", element: withSuspense(Auth) },
  { path: "/email-confirmation", element: withSuspense(EmailConfirmation) },
  { path: "/reset-password", element: withSuspense(ResetPassword) },
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
