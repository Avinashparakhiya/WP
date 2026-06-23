import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SPACING } from "../constants/layout";
import { categoryColors } from "../constants/colors";
import type { CategoryColor } from "../constants/colors";
import { useColors } from "../lib/useColors";

interface SectionHeaderProps {
  label: string;
  color: CategoryColor;
  icon: keyof typeof Feather.glyphMap;
}

export function SectionHeader({ label, color, icon }: SectionHeaderProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Feather name={icon} size={16} color={categoryColors[color]} />
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: 4,
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
});
