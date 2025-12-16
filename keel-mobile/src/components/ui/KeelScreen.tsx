//keel-mobile/src/components/ui/KeelScreen.tsx

/**
 * ============================================================
 * KeelScreen — Base Screen Wrapper (Safe-Area Correct)
 * ============================================================
 *
 * RESPONSIBILITY:
 * - Apply ONLY safe-area constraints
 * - Apply ONLY horizontal padding
 *
 * MUST NOT:
 * - Add vertical padding
 * - Add bottom spacing (handled by tab navigator)
 *
 * Vertical spacing is the responsibility of
 * individual screens (Home, Wizard, etc).
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type KeelScreenProps = {
  children: React.ReactNode;
};

export const KeelScreen: React.FC<KeelScreenProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={["left", "right"]} // ❗ Prevent double top/bottom padding
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.container}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20, // ✅ Horizontal spacing only
  },
});
