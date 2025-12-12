//keel-mobile/src/components/layout/AppHeader.tsx

import React from "react";
import { Alert } from "react-native";
import { Appbar, useTheme } from "react-native-paper";
import { useAuth } from "../../auth/AuthContext";

interface AppHeaderProps {
  title?: string;
}

export default function AppHeader({ title = "KEEL" }: AppHeaderProps) {
  const theme = useTheme();
  const { themeMode, toggleTheme } = useAuth();

  const handleNotifications = () => {
    Alert.alert("Notifications", "Coming soon");
  };

  const handleToggleTheme = async () => {
    await toggleTheme();
  };

  return (
    <Appbar.Header elevated>
      <Appbar.Content title={title} />

      <Appbar.Action
        icon={themeMode === "dark" ? "weather-sunny" : "moon-waning-crescent"}
        onPress={handleToggleTheme}
      />

      <Appbar.Action
        icon="bell-outline"
        onPress={handleNotifications}
      />
    </Appbar.Header>
  );
}
