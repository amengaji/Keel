//keel-mobile/App.tsx

import React, { useEffect } from "react";
import { Provider as PaperProvider } from "react-native-paper";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { keelLightTheme, keelDarkTheme } from "./src/theme/keelTheme";
import { initDatabase } from "./src/db/database";

function ThemedApp() {
  const { themeMode } = useAuth();

  const theme =
    themeMode === "dark" ? keelDarkTheme : keelLightTheme;

  useEffect(() => {
    try {
      initDatabase();
      console.log("SQLite database initialized");
    } catch (err) {
      console.error("SQLite init error", err);
    }
  }, []);

  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemedApp />
    </AuthProvider>
  );
}
