// keel-web/vite.config.ts
//
// Keel Shore Admin — Vite Configuration
// ----------------------------------------------------
// PURPOSE:
// - Enable React
// - Proxy API calls to backend during development
//
// WHY THIS IS REQUIRED:
// - Frontend runs on :5173
// - Backend runs on :5000
// - Without proxy, /auth/login hits Vite instead of Express
//
// IMPORTANT:
// - This is DEV ONLY
// - Production will use proper domain routing

// keel-web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/me": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
