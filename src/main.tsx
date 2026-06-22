import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { installJsonParseTrace } from "./utils/debug/jsonParseTrace";
import { installRealtimeTrace } from "./utils/debug/realtimeTrace";

// TEMP diagnostics — capture root cause of "Unexpected token '('".
installJsonParseTrace();
installRealtimeTrace();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
