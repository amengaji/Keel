//keel-mobile/src/components/ui/KeelScreen.tsx

/**
 * ============================================================
 * KeelScreen — Base Screen Wrapper (ANDROID SAFE)
 * ============================================================
 *
 * RESPONSIBILITY:
 * - Handle safe-area insets correctly across platforms
 * - Protect content from:
 *   • AppHeader (top)
 *   • Bottom Tabs
 *   • Android system navigation bar (3-button / gesture)
 *
 * USAGE:
 * - Full-bleed screens (wizards): <KeelScreen />
 * - Standard content screens:     <KeelScreen withVerticalInsets />
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type KeelScreenProps = {
  children: React.ReactNode;

  /**
   * Enables top + bottom insets.
   * REQUIRED for screens with bottom actions.
   */
  withVerticalInsets?: boolean;
};

export const KeelScreen: React.FC<KeelScreenProps> = ({
  children,
  withVerticalInsets = false,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={withVerticalInsets ? ["top", "left", "right"] : ["left", "right"]}
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View
        style={[
          styles.container,
          withVerticalInsets && {
            paddingBottom: insets.bottom + 16, // 🔑 ANDROID FIX
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20, // KEEL horizontal standard
  },
});
