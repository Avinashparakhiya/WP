import React, { useCallback } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useColors } from "../lib/useColors";
import { RADIUS, RADIUS_SM, SPACING } from "../constants/layout";

interface ResultCardProps {
  result: string;
  onCopy?: () => void;
}

export function ResultCard({ result, onCopy }: ResultCardProps) {
  const colors = useColors();

  const handleCopy = useCallback(() => {
    Clipboard.setStringAsync(result);
    onCopy?.();
  }, [result, onCopy]);

  const handleShare = useCallback(async () => {
    try {
      await Sharing.shareAsync(result, { dialogTitle: "Share message" });
    } catch {
      // User cancelled or share not available
    }
  }, [result]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        <Text style={[styles.resultText, { color: colors.foreground }]}>{result}</Text>
      </ScrollView>
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, { backgroundColor: `${colors.primary}20` }]}
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel="Copy"
        >
          <Feather name="copy" size={16} color={colors.primary} />
          <Text style={[styles.buttonText, { color: colors.primary }]}>Copy</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { backgroundColor: `${colors.secondary}20` }]}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Feather name="share-2" size={16} color={colors.secondary} />
          <Text style={[styles.buttonText, { color: colors.secondary }]}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: "hidden",
  },
  scrollArea: {
    maxHeight: 200,
    padding: SPACING.md,
  },
  resultText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderColor: "#E9EDEF",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS_SM,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
