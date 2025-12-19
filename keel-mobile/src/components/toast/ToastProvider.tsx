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
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { useTheme } from "react-native-paper";
import { keelLightTheme, keelDarkTheme, } from "../../theme/keelTheme";

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
import { Dimensions, Appearance } from "react-native";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export const toastConfig = {
  success: (props: any) => {
    const theme =
      Appearance.getColorScheme() === "dark"
        ? keelDarkTheme
        : keelLightTheme;

    return (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: theme.colors.primary,
          backgroundColor: theme.colors.surface,
          width: isTablet ? "90%" : "95%",
          minHeight: isTablet ? 80 : 60,
        }}
        contentContainerStyle={{
          paddingHorizontal: isTablet ? 20 : 12,
        }}
        text1Style={{
          fontSize: isTablet ? 18 : 14,
          fontWeight: "600",
          color: theme.colors.onSurface,
        }}
        text2Style={{
          fontSize: isTablet ? 16 : 13,
          color: theme.colors.onSurfaceVariant,
        }}
      />
    );
  },

  error: (props: any) => {
    const theme =
      Appearance.getColorScheme() === "dark"
        ? keelDarkTheme
        : keelLightTheme;

    return (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: theme.colors.error,
          backgroundColor: theme.colors.surface,
          width: isTablet ? "90%" : "95%",
          minHeight: isTablet ? 80 : 60,
        }}
        contentContainerStyle={{
          paddingHorizontal: isTablet ? 20 : 12,
        }}
        text1Style={{
          fontSize: isTablet ? 18 : 14,
          fontWeight: "600",
          color: theme.colors.onSurface,
        }}
        text2Style={{
          fontSize: isTablet ? 16 : 13,
          color: theme.colors.onSurfaceVariant,
        }}
      />
    );
  },
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
