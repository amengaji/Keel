// src/main.tsx
// Location: keel-web/src/main.tsx
//
// Keel Shore Admin — Web Entry
// - React Router
// - Global CSS
// - App mounts here

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
