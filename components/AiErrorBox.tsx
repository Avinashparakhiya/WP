import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING } from "../constants/layout";

interface AiErrorBoxProps {
  error: string;
  onDismiss?: () => void;
}

function detectErrorType(error: string): {
  type: "billing" | "api_key" | "generic";
  link?: string;
  linkLabel?: string;
} {
  const lower = error.toLowerCase();
  if (
    lower.includes("quota") ||
    lower.includes("billing") ||
    lower.includes("exceeded your current")
  ) {
    return {
      type: "billing",
      link: "https://platform.openai.com/account/billing",
      linkLabel: "OpenAI Billing",
    };
  }
  if (lower.includes("key") || lower.includes("invalid")) {
    return { type: "api_key" };
  }
  return { type: "generic" };
}

export function AiErrorBox({ error, onDismiss }: AiErrorBoxProps) {
  const colors = useColors();
  const { type, link, linkLabel } = detectErrorType(error);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: `${colors.destructive}15`, borderColor: `${colors.destructive}40` },
      ]}
    >
      <View style={styles.header}>
        <Feather name="alert-triangle" size={18} color={colors.destructive} />
        <Text style={[styles.title, { color: colors.destructive }]}>
          {type === "billing"
            ? "Quota / Billing Issue"
            : type === "api_key"
              ? "API Key Error"
              : "Error"}
        </Text>
        {onDismiss ? (
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.message, { color: colors.foreground }]}>{error}</Text>
      {link ? (
        <Pressable
          style={styles.linkButton}
          onPress={() => Linking.openURL(link)}
          accessibilityRole="link"
        >
          <Feather name="external-link" size={14} color={colors.primary} />
          <Text style={[styles.linkText, { color: colors.primary }]}>
            {linkLabel ?? "Learn More"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  message: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
