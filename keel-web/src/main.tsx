// src/main.tsx
// Location: keel-web/src/main.tsx
//
// Keel Shore Admin — Web Entry (UPDATED)
// ----------------------------------------------------
// PURPOSE:
// - Mount React app
// - Enable routing
// - Wire Signature Vault globally (CRITICAL)
// - Load global CSS
//
// NOTE:
// Without SignatureVaultProvider, the app WILL crash
// when any screen tries to access signature state.

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

/* 🔐 Signature Vault Provider */
import { SignatureVaultProvider } from "./admin/security/SignatureVaultContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 
        SignatureVaultProvider wraps the ENTIRE app.
        This ensures:
        - Dashboard loads correctly
        - Topbar can unlock signatures
        - Audit + Approval flows work everywhere
      */}
      <SignatureVaultProvider>
        <App />
      </SignatureVaultProvider>
    </BrowserRouter>
  </React.StrictMode>
);
