import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING } from "../constants/layout";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.icon]}>😕</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>
        An unexpected error occurred. Please try again.
      </Text>
      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={resetError}>
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
      {__DEV__ ? (
        <ScrollView style={styles.errorBox}>
          <Text style={styles.errorText}>{error.toString()}</Text>
          {error.stack ? <Text style={styles.errorText}>{error.stack}</Text> : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    opacity: 0.8,
  },
  button: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
    marginTop: SPACING.sm,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  errorBox: {
    marginTop: SPACING.lg,
    maxHeight: 200,
    backgroundColor: "#1a1a1a",
    borderRadius: RADIUS,
    padding: SPACING.md,
    width: "100%",
  },
  errorText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#ff6b6b",
  },
});
