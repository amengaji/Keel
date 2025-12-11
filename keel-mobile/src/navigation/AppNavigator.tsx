import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthContext } from "../auth/AuthContext";

import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

export default function AppNavigator() {
  const ctx = useContext(AuthContext);

  if (!ctx) return null;

  return (
    <NavigationContainer>
      {ctx.user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
