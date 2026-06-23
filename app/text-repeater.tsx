import React, { useState, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Header } from "../components/Header";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING } from "../constants/layout";
import { addHistory } from "../lib/storage";

const SEPARATORS = [
  { label: "None", value: "" },
  { label: "Space", value: " " },
  { label: "New Line", value: "\n" },
  { label: "Dash", value: " - " },
  { label: "Dot", value: ". " },
  { label: "Comma", value: ", " },
];

export default function TextRepeaterScreen() {
  const colors = useColors();
  const [text, setText] = useState("");
  const [count, setCount] = useState("5");
  const [separator, setSeparator] = useState(" ");
  const [copied, setCopied] = useState(false);

  const repeatCount = Math.max(1, Math.min(1000, parseInt(count) || 1));

  const result = useMemo(() => {
    if (!text.trim()) return "";
    return Array(repeatCount).fill(text).join(separator);
  }, [text, repeatCount, separator]);

  const handleCopy = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addHistory("Text Repeater", `${repeatCount}x "${text.slice(0, 30)}..."`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View style={{ paddingTop: (insets?.top ?? 0) + 16 }}>
            <Header title="Text Repeater" subtitle="Repeat text multiple times" />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <View style={styles.inputSection}>
        <Text style={[styles.label, { color: colors.foreground }]}>Text</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.foreground,
              borderColor: colors.inputBorder,
            },
          ]}
          placeholder="Enter text to repeat..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.foreground }]}>
          Repeat count: {repeatCount}
        </Text>
        <View style={styles.countRow}>
          <Pressable
            style={[styles.countBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setCount(String(Math.max(1, repeatCount - 1)))}
          >
            <Feather name="minus" size={18} color={colors.foreground} />
          </Pressable>
          <TextInput
            style={[
              styles.countInput,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
            textAlign="center"
          />
          <Pressable
            style={[styles.countBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setCount(String(Math.min(1000, repeatCount + 1)))}
          >
            <Feather name="plus" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Separator</Text>
        <View style={styles.separatorRow}>
          {SEPARATORS.map((sep) => (
            <Pressable
              key={sep.value}
              style={[
                styles.sepChip,
                {
                  backgroundColor: separator === sep.value ? `${colors.primary}20` : colors.card,
                  borderColor: separator === sep.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSeparator(sep.value)}
            >
              <Text
                style={[
                  styles.sepChipText,
                  {
                    color: separator === sep.value ? colors.primary : colors.mutedForeground,
                  },
                ]}
              >
                {sep.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {result ? (
        <View style={styles.resultSection}>
          <View
            style={[
              styles.resultCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
              {repeatCount} repetitions · {result.length} characters
            </Text>
            <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.resultText, { color: colors.foreground }]} selectable>
                {result}
              </Text>
            </ScrollView>
          </View>
          <Pressable
            style={[
              styles.copyBtn,
              {
                backgroundColor: copied ? `${colors.primary}20` : colors.primary,
              },
            ]}
            onPress={handleCopy}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={18}
              color={copied ? colors.primary : "#FFFFFF"}
            />
            <Text style={[styles.copyBtnText, { color: copied ? colors.primary : "#FFFFFF" }]}>
              {copied ? "Copied!" : "Copy Text"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inputSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 60,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  countBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countInput: {
    flex: 1,
    borderRadius: RADIUS,
    borderWidth: 1,
    height: 44,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  separatorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  sepChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  sepChipText: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  resultSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  resultCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  resultMeta: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultScroll: {
    maxHeight: 200,
  },
  resultText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
  },
  copyBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
