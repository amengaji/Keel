// App.tsx
import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider } from "./src/auth/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { keelLightTheme } from "./src/theme/keelTheme";

export default function App() {
  return (
    <PaperProvider theme={keelLightTheme}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
