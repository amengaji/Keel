//keel-mobile/App.tsx

import React from "react";
import { Provider as PaperProvider } from "react-native-paper";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { keelLightTheme, keelDarkTheme } from "./src/theme/keelTheme";

function ThemedApp() {
  const { themeMode } = useAuth();

  const theme =
    themeMode === "dark" ? keelDarkTheme : keelLightTheme;

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
