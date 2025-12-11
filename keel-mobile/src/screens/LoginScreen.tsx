//keel-mobile/src/screens/LoginScreen.tsx
console.log(">>> NEW LOGIN SCREEN IS RENDERING <<<");

import React, { useState } from "react";
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";
import { KeelButton } from "../components/ui/KeelButton";
import { useAuth } from "../auth/AuthContext";

export default function LoginScreen() {
  const theme = useTheme();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        
        {/* Header section */}
        <View style={styles.headerWrapper}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text variant="headlineMedium" style={styles.title}>
            Welcome Aboard
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Sign in to continue your training
          </Text>
        </View>

        {/* Input section */}
        <View style={styles.formWrapper}>
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            outlineColor="#C5C5C5"
            activeOutlineColor={theme.colors.primary}
          />

          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            outlineColor="#C5C5C5"
            activeOutlineColor={theme.colors.primary}
          />

          {error.length > 0 && (
            <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
          )}



          <KeelButton
            mode="primary"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </KeelButton>

        </View>

        <View style={styles.footerSpace} />

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  headerWrapper: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
  title: {
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  subtitle: {
    color: "#64748B",
  },
  formWrapper: {
    marginTop: 10,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  loginButton: {
    marginTop: 10,
  },
  footerSpace: {
    flex: 1,
  },
});
