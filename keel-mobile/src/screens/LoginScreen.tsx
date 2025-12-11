import React, { useContext, useState } from "react";
import { View } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { AuthContext } from "../context/AuthContext";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const ctx = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    await ctx?.login(email, password);
    navigation.navigate("EnableBiometrics");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 28, marginBottom: 30 }}>Login</Text>

      <TextInput 
        label="Email" 
        mode="outlined" 
        value={email} 
        onChangeText={setEmail}
        style={{ marginBottom: 10 }}
      />

      <TextInput 
        label="Password" 
        mode="outlined" 
        secureTextEntry 
        value={password} 
        onChangeText={setPassword}
        style={{ marginBottom: 20 }}
      />

      <Button mode="contained" onPress={handleLogin}>Login</Button>
    </View>
  );
}
