//keel-mobile/src/screens/EnableBiometricsScreen.tsx
console.log(">>> BIOMETRICS SCREEN <<<");
import React, { useContext } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { AuthContext } from "../auth/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "EnableBiometrics">;

export default function EnableBiometricsScreen() {
  const ctx = useContext(AuthContext);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Enable biometric login?
      </Text>

      <Button 
        mode="contained" 
        onPress={() => ctx?.enableBiometrics()}
        style={{ marginBottom: 10 }}
      >
        Yes, Enable
      </Button>

      <Button mode="outlined">
        Skip
      </Button>
    </View>
  );
}
