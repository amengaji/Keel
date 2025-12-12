//keel-mobile/src/navigation/AppNavigator.tsx

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import EnableBiometricsScreen from "../screens/EnableBiometricsScreen";
import OnboardingNavigator from "./OnboardingNavigator";

export default function AppNavigator() {
  const {
    user,
    loading,
    biometricPromptSeen,
    onboardingCompleted,
  } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      {!user && <AuthNavigator />}

      {user && !biometricPromptSeen && <EnableBiometricsScreen />}

      {user && biometricPromptSeen && !onboardingCompleted && (
        <OnboardingNavigator />
      )}

      {user && biometricPromptSeen && onboardingCompleted && (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}
