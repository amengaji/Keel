//keel-mobile/src/components/toast/ToastProvider.tsx

/**
 * ============================================================
 * Global Toast Provider
 * ============================================================
 *
 * This provider exposes a single, centralized toast system
 * for the entire app.
 *
 * FEATURES:
 * - Success / Error / Warning / Info toasts
 * - Theme-aware (light & dark mode)
 * - Uses react-native-paper Snackbar
 * - No duplication across screens
 *
 * USAGE:
 * Wrap this provider once at app root.
 */

import React, { createContext, ReactNode, useCallback, useState } from "react";
import { Snackbar, useTheme } from "react-native-paper";

/**
 * Toast severity types.
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Shape of context exposed to consumers.
 */
export interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

/**
 * Internal context.
 */
export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

/**
 * ============================================================
 * PROVIDER
 * ============================================================
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");

  /**
   * Hide snackbar.
   */
  const hideToast = () => setVisible(false);

  /**
   * Core function to show a toast.
   */
  const showToast = useCallback((msg: string, toastType: ToastType) => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
  }, []);

  /**
   * Public helpers exposed via context.
   */
  const contextValue: ToastContextType = {
    success: (msg) => showToast(msg, "success"),
    error: (msg) => showToast(msg, "error"),
    warning: (msg) => showToast(msg, "warning"),
    info: (msg) => showToast(msg, "info"),
  };

  /**
   * Background color per toast type.
   */
  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#16A34A"; // green
      case "error":
        return "#DC2626"; // red
      case "warning":
        return "#D97706"; // amber
      case "info":
      default:
        return theme.colors.primary;
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Global Snackbar */}
      <Snackbar
        visible={visible}
        onDismiss={hideToast}
        duration={3000}
        style={{
          backgroundColor: getBackgroundColor(),
        }}
        action={{
          label: "OK",
          onPress: hideToast,
          textColor: "#FFFFFF",
        }}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
}
