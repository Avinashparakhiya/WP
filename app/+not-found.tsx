import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING } from "../constants/layout";

export default function NotFoundScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>🔍</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Page Not Found</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>
        This page doesn't exist or has been moved.
      </Text>
      <Link href="/" asChild>
        <Pressable style={[styles.button, { backgroundColor: colors.primary }]}>
          <Feather name="home" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Go Home</Text>
        </Pressable>
      </Link>
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
  emoji: { fontSize: 48 },
  title: {
    fontSize: 20,
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
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
    marginTop: SPACING.lg,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
