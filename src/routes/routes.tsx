
import { Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import Map from "@/pages/Map";
import Messages from "@/pages/Messages";
import Post from "@/pages/Post";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import EmailConfirmation from "@/pages/EmailConfirmation";
import CreateProfile from "@/pages/CreateProfile";
import NotFound from "@/pages/NotFound";
import { PrivateRoute } from "@/components/auth/PrivateRoute";

export const publicRoutes = [
  { path: "/", element: <Index /> },
  { path: "/map", element: <Map /> },
  { path: "/auth", element: <Auth /> },
  { path: "/email-confirmation", element: <EmailConfirmation /> },
  { path: "*", element: <NotFound /> },
];

export const privateRoutes = [
  { 
    path: "/messages", 
    element: <PrivateRoute><Messages /></PrivateRoute>
  },
  { 
    path: "/post", 
    element: <PrivateRoute><Post /></PrivateRoute>
  },
  { 
    path: "/profile", 
    element: <PrivateRoute><Profile /></PrivateRoute>
  },
  { 
    path: "/create-profile", 
    element: <PrivateRoute><CreateProfile /></PrivateRoute>
  },
];
