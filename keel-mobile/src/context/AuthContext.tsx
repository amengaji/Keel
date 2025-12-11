import React, { createContext, useState, useEffect, ReactNode } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  biometricEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  enableBiometrics: () => Promise<void>;
  biometricLogin: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    const storedUser = await SecureStore.getItemAsync("user");
    const bio = await SecureStore.getItemAsync("biometricEnabled");

    setBiometricEnabled(bio === "true");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });

    await SecureStore.setItemAsync("accessToken", res.data.accessToken);
    await SecureStore.setItemAsync("refreshToken", res.data.refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
  };

  const enableBiometrics = async () => {
    await SecureStore.setItemAsync("biometricEnabled", "true");
    setBiometricEnabled(true);
  };

  const biometricLogin = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate",
    });
    if (!auth.success) return false;

    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    if (!refreshToken) return false;

    const res = await api.post("/auth/refresh", { refreshToken });

    await SecureStore.setItemAsync("accessToken", res.data.accessToken);

    const storedUser = await SecureStore.getItemAsync("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    return true;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        biometricEnabled,
        login,
        logout,
        enableBiometrics,
        biometricLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
