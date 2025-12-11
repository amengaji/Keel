import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { Button } from "react-native-paper";

export type KeelButtonMode = "primary" | "secondary" | "outline";

export type KeelButtonProps = {
  children: React.ReactNode;
  mode?: KeelButtonMode;
  loading?: boolean;
  disabled?: boolean;   // ← ADD THIS
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const KeelButton: React.FC<KeelButtonProps> = ({
  children,
  mode = "primary",
  loading = false,
  disabled = false,      // ← ADD THIS
  onPress,
  style,
}) => {
  let backgroundColor = "#3194A0";
  let textColor = "#FFFFFF";
  let borderColor = "transparent";

  if (mode === "secondary") {
    backgroundColor = "#FFFFFF";
    textColor = "#3194A0";
    borderColor = "#3194A0";
  }

  if (mode === "outline") {
    backgroundColor = "transparent";
    textColor = "#3194A0";
    borderColor = "#3194A0";
  }

  return (
    <Button
      mode="contained"
      onPress={onPress}
      loading={loading}
      disabled={disabled}   // ← ADD THIS
      style={[
        {
          backgroundColor,
          borderRadius: 10,
          borderWidth: mode === "outline" ? 2 : 1,
          borderColor,
          paddingVertical: 4,
          opacity: disabled ? 0.5 : 1,  // optional visual feedback
        },
        style,
      ]}
      labelStyle={{
        color: textColor,
        fontWeight: "600",
        fontSize: 16,
      }}
    >
      {children}
    </Button>
  );
};
