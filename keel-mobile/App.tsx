//keel-mobile/App.tsx

import React, { useEffect } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import Toast, {
  BaseToast,
  ErrorToast,
} from "react-native-toast-message";

import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { keelLightTheme, keelDarkTheme } from "./src/theme/keelTheme";
import { initDatabase } from "./src/db/database";

/**
 * Toast configuration
 * -------------------
 * Explicit styles are defined so:
 * - Success = Green
 * - Info = Blue
 * - Error = Red
 * - Toasts stack cleanly (no overlap)
 */
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#2ECC71", // green
        marginBottom: 8,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "700",
      }}
      text2Style={{
        fontSize: 13,
      }}
    />
  ),

  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#3498DB", // blue
        marginBottom: 8,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "700",
      }}
      text2Style={{
        fontSize: 13,
      }}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#E74C3C", // red
        marginBottom: 8,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "700",
      }}
      text2Style={{
        fontSize: 13,
      }}
    />
  ),
};

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
      {/* App navigation */}
      <AppNavigator />

      {/* 
        Global Toast Host
        -----------------
        - Bottom positioned (mobile UX standard)
        - bottomOffset avoids system navigation overlap
        - toastConfig restores colour semantics
      */}
      <Toast
        position="bottom"
        bottomOffset={70}
        config={toastConfig}
      />
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
