// App entry point
// Local push access confirmed

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { Capacitor } from "@capacitor/core";
import { installNativeDeepLinks } from "./native/deepLinks";
import { installNativeGeolocation } from "./native/geolocationBridge";
import { installNativePush } from "./native/push";
import { installAssetRecovery } from "./lib/assetRecovery";

// A cached HTML copy in place of a chunk or the stylesheet (after a deploy)
// repairs itself instead of leaving "Kunde inte ladda sidan" / an unstyled page.
installAssetRecovery();
(window as Window & { __pifBooted?: boolean }).__pifBooted = true;

// Native apps only (no-op on the web): must run before anything asks for a position.
installNativeGeolocation();
installNativeDeepLinks();
installNativePush();
// Lets the stylesheet pad for the status bar in the apps only.
if (Capacitor.isNativePlatform()) document.documentElement.classList.add("native-app");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
