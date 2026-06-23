import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useColors } from "../lib/useColors";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
}

export function LoadingSpinner({ size = "large", color }: LoadingSpinnerProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color ?? colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
