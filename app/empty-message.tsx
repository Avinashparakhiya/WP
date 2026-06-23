import React, { useState, useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Header } from "../components/Header";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING } from "../constants/layout";
import { addHistory } from "../lib/storage";

interface InvisibleChar {
  name: string;
  char: string;
  length: number;
}

const INVISIBLE_CHARS: InvisibleChar[] = [
  { name: "Zero Width Space", char: "\u200B", length: 1 },
  { name: "Zero Width Joiner", char: "\u200D", length: 1 },
  { name: "Zero Width Non-Joiner", char: "\u200C", length: 1 },
  { name: "Invisible Separator", char: "\u2063", length: 1 },
  { name: "Word Joiner", char: "\u2060", length: 1 },
  { name: "Zero Width No-Break", char: "\uFEFF", length: 1 },
  { name: "Invisible Plus", char: "\u2064", length: 1 },
  { name: "Hangul Filler", char: "\u3164", length: 1 },
];

export default function EmptyMessageScreen() {
  const colors = useColors();
  const [customCount, setCustomCount] = useState(100);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleCopy = useCallback(async (name: string, char: string, count: number = 1) => {
    const text = char.repeat(count);
    await Clipboard.setStringAsync(text);
    setCopiedType(name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addHistory("Empty Message", `${name} × ${count}`);
    setTimeout(() => setCopiedType(null), 2000);
  }, []);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="Empty Message" subtitle="Send invisible characters on WhatsApp" />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          SINGLE INVISIBLE CHARACTERS
        </Text>
        {INVISIBLE_CHARS.map((ic) => (
          <Pressable
            key={ic.name}
            style={[
              styles.charCard,
              {
                backgroundColor: colors.card,
                borderColor: copiedType === ic.name ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleCopy(ic.name, ic.char, 1)}
          >
            <View style={styles.charInfo}>
              <Feather name="eye-off" size={16} color={colors.primary} />
              <View style={styles.charDetails}>
                <Text style={[styles.charName, { color: colors.foreground }]}>{ic.name}</Text>
                <Text style={[styles.charPreview, { color: colors.mutedForeground }]}>
                  Preview: |{ic.char}| ({ic.length} char)
                </Text>
              </View>
            </View>
            <View style={styles.copyBadge}>
              <Feather
                name={copiedType === ic.name ? "check" : "copy"}
                size={14}
                color={copiedType === ic.name ? colors.primary : colors.mutedForeground}
              />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CUSTOM LENGTH</Text>
        <View style={styles.customRow}>
          {[50, 100, 500, 1000, 5000].map((count) => (
            <Pressable
              key={count}
              style={[
                styles.countChip,
                {
                  backgroundColor: customCount === count ? `${colors.primary}20` : colors.card,
                  borderColor: customCount === count ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setCustomCount(count)}
            >
              <Text
                style={[
                  styles.countChipText,
                  {
                    color: customCount === count ? colors.primary : colors.mutedForeground,
                  },
                ]}
              >
                {count}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[styles.generateBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleCopy(`Custom (${customCount})`, "\u200B", customCount)}
        >
          <Feather
            name={copiedType?.includes("Custom") ? "check" : "copy"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.generateBtnText}>
            {copiedType?.includes("Custom") ? "Copied!" : `Copy ${customCount} Invisible Chars`}
          </Text>
        </Pressable>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Uses Zero Width Space characters. They look blank but take up space.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  charCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  charInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  charDetails: {
    gap: 2,
  },
  charName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  charPreview: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  copyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F2F520",
  },
  customRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  countChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  countChipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: SPACING.md,
  },
});
