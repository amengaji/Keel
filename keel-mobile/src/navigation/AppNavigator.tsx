//keel-mobile/src/navigation/AppNavigator.tsx

/**
 * ============================================================
 * AppNavigator — Root Navigation Container
 * ============================================================
 *
 * IMPORTANT:
 * - This is the ROOT of the app navigation tree
 * - All global providers that must be available app-wide
 *   MUST be mounted here
 *
 * WHY SeaServiceProvider IS HERE:
 * - Home dashboard reads Sea Service compliance
 * - Sea Service Wizard writes Sea Service data
 * - Both must share the SAME context instance
 *
 * NO BUSINESS LOGIC is changed in this file.
 * Existing auth / onboarding / biometric flows
 * are preserved exactly as-is.
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import EnableBiometricsScreen from "../screens/EnableBiometricsScreen";
import OnboardingNavigator from "./OnboardingNavigator";

// ✅ Global domain provider (Sea Service)
import { SeaServiceProvider } from "../sea-service/SeaServiceContext";

export default function AppNavigator() {
  const {
    user,
    loading,
    biometricPromptSeen,
    onboardingCompleted,
  } = useAuth();

  // Preserve existing loading behavior
  if (loading) return null;

  return (
    <SeaServiceProvider>
      <NavigationContainer>
        {/* --------------------------------------------------------
            AUTH FLOW (unchanged)
           -------------------------------------------------------- */}
        {!user && <AuthNavigator />}

        {/* --------------------------------------------------------
            BIOMETRIC PROMPT (unchanged)
           -------------------------------------------------------- */}
        {user && !biometricPromptSeen && (
          <EnableBiometricsScreen />
        )}

        {/* --------------------------------------------------------
            ONBOARDING FLOW (unchanged)
           -------------------------------------------------------- */}
        {user && biometricPromptSeen && !onboardingCompleted && (
          <OnboardingNavigator />
        )}

        {/* --------------------------------------------------------
            MAIN APPLICATION (unchanged)
           -------------------------------------------------------- */}
        {user && biometricPromptSeen && onboardingCompleted && (
          <MainNavigator />
        )}
      </NavigationContainer>
    </SeaServiceProvider>
  );
}
