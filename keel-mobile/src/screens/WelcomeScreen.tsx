
//keel-mobile/src/screens/WelcomeScreen.tsx
console.log(">>> WELCOME SCREEN <<<");
import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { KeelScreen } from "../components/ui/KeelScreen";
import { KeelButton } from "../components/ui/KeelButton";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();

  return (
    <KeelScreen>
      <View style={styles.top}>
        <Text
          variant="headlineMedium"
          style={[styles.appTitle, { color: theme.colors.primary }]}
        >
          KEEL
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Digital Training Record Book
        </Text>
        <Text variant="bodyMedium" style={styles.body}>
          Track your onboard learning, complete tasks, and stay aligned with
          company training standards – all in one place.
        </Text>
      </View>

      <View style={styles.illustrationWrapper}>
        {/* Optional illustration in the future */}
        <Image
          source={require("../../assets/splash-icon.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottom}>
        <KeelButton
          mode="primary"
          onPress={() => navigation.navigate("Login")}
        >
          Continue to Login
        </KeelButton>

        <KeelButton
          mode="outline"
          onPress={() => navigation.navigate("EnableBiometrics")}
        >
          Setup Biometrics
        </KeelButton>

        <Text variant="bodySmall" style={styles.footer}>
          Keel is part of the Element Tree suite. Built for cadets, officers,
          and training departments.
        </Text>
      </View>
    </KeelScreen>
  );
};

const styles = StyleSheet.create({
  top: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  appTitle: {
    fontWeight: "800",
    letterSpacing: 4,
  },
  subtitle: {
    marginTop: 4,
    fontWeight: "600",
  },
  body: {
    marginTop: 12,
    color: "#6B7280",
  },
  illustrationWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: "70%",
    height: 180,
    opacity: 0.9,
  },
  bottom: {
    paddingBottom: 12,
  },
  footer: {
    marginTop: 16,
    textAlign: "center",
    color: "#9CA3AF",
  },
});

export default WelcomeScreen;
