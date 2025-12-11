import React, { useContext } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { AuthContext } from "../context/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  const ctx = useContext(AuthContext);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 28, textAlign: "center", marginBottom: 40 }}>
        Welcome to KEEL
      </Text>

      <Button mode="contained" onPress={() => navigation.navigate("Login")}>
        Login
      </Button>

      {ctx?.biometricEnabled === true && (
        <Button
          mode="outlined"
          style={{ marginTop: 10 }}
          onPress={async () => {
            await ctx.biometricLogin();
          }}
        >
          Login with Biometrics
        </Button>
      )}
    </View>
  );
}
