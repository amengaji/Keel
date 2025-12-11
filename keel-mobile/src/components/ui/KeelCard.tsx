import React from "react";
import { StyleSheet } from "react-native";
import { Card, useTheme, Text } from "react-native-paper";

type KeelCardProps = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export const KeelCard: React.FC<KeelCardProps> = ({
  title,
  subtitle,
  children,
}) => {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {(title || subtitle) && (
        <Card.Title
          title={title}
          titleVariant="titleMedium"
          titleStyle={{ fontWeight: "600" }}
          subtitle={subtitle}
          subtitleVariant="bodySmall"
        />
      )}
      {children && (
        <Card.Content style={styles.content}>{children}</Card.Content>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 1,
  },
  content: {
    paddingBottom: 12,
  },
});
