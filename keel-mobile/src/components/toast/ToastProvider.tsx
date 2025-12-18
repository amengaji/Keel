//keel-mobile/src/components/toast/ToastProvider.tsx

/**
 * ============================================================
 * Global Toast Provider (react-native-toast-message)
 * ============================================================
 *
 * - Header-safe (always visible)
 * - Navigation-safe
 * - Severity-based styling
 * - Left border color indicator (enterprise UX)
 * - Keeps existing useToast() API intact
 */

import React, { createContext, ReactNode } from "react";
import Toast, {
  BaseToast,
  ErrorToast,
} from "react-native-toast-message";
import { useTheme } from "react-native-paper";

/**
 * Toast severity types.
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Context shape.
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
 * Toast Configuration
 * ============================================================
 */
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#16A34A" }}
      text1Style={{ fontWeight: "700" }}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: "#DC2626" }}
      text1Style={{ fontWeight: "700" }}
    />
  ),

  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#D97706" }}
      text1Style={{ fontWeight: "700" }}
    />
  ),

  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "#2563EB" }}
      text1Style={{ fontWeight: "700" }}
    />
  ),
};

/**
 * ============================================================
 * PROVIDER
 * ============================================================
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();

  const contextValue: ToastContextType = {
    success: (msg) =>
      Toast.show({
        type: "success",
        text1: "Success",
        text2: msg,
        position: "top",
      }),

    error: (msg) =>
      Toast.show({
        type: "error",
        text1: "Error",
        text2: msg,
        position: "top",
      }),

    warning: (msg) =>
      Toast.show({
        type: "warning",
        text1: "Warning",
        text2: msg,
        position: "top",
      }),

    info: (msg) =>
      Toast.show({
        type: "info",
        text1: "Info",
        text2: msg,
        position: "top",
      }),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast renderer config */}
      <Toast config={toastConfig} />
    </ToastContext.Provider>
  );
}
