// App entry point
// Local push access confirmed

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { Capacitor } from "@capacitor/core";
import { installNativeGeolocation } from "./native/geolocationBridge";

// Native apps only (no-op on the web): must run before anything asks for a position.
installNativeGeolocation();
// Lets the stylesheet pad for the status bar in the apps only.
if (Capacitor.isNativePlatform()) document.documentElement.classList.add("native-app");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
