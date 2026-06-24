import React, { useState, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/useColors";
import {
  RADIUS,
  RADIUS_SM,
  SPACING,
  CONTENT_BOTTOM_PADDING,
  HEADER_PADDING_TOP,
} from "../constants/layout";
import { addHistory } from "../lib/storage";

const GREEN = "#25D366";
const SEPARATORS = [
  { label: "Space", value: " " },
  { label: "New Line", value: "\n" },
  { label: "Comma", value: ", " },
  { label: "Dash", value: " - " },
  { label: "Dot", value: ". " },
  { label: "None", value: "" },
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
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header ── */}
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <View
            style={[
              styles.header,
              {
                paddingTop: (insets?.top ?? 0) + HEADER_PADDING_TOP,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/");
                }
              }}
              style={styles.backBtn}
              hitSlop={12}
            >
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Text Repeater</Text>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputSection}>
          {/* ── Card 1: Text Input ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TEXT</Text>
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
          </View>

          {/* ── Card 2: Count Stepper ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              COUNT (1-1000)
            </Text>
            <View style={styles.countRow}>
              <Pressable
                style={[styles.countBtn, { backgroundColor: colors.muted }]}
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
                onChangeText={(val) => setCount(val.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
              />
              <Pressable
                style={[styles.countBtn, { backgroundColor: colors.muted }]}
                onPress={() => setCount(String(Math.min(1000, repeatCount + 1)))}
              >
                <Feather name="plus" size={18} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          {/* ── Card 3: Separator Choice ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SEPARATOR</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.separatorRow}
            >
              {SEPARATORS.map((sep) => (
                <Pressable
                  key={sep.label}
                  style={[
                    styles.sepChip,
                    separator === sep.value
                      ? { backgroundColor: GREEN, borderColor: GREEN }
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setSeparator(sep.value)}
                >
                  <Text
                    style={[
                      styles.sepChipText,
                      {
                        color: separator === sep.value ? "#FFFFFF" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {sep.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── Result Card ── */}
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
                  backgroundColor: copied ? `${colors.primary}20` : GREEN,
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  /* Input Section */
  inputSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  card: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
  },

  /* Stepper */
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  countBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS_SM,
    alignItems: "center",
    justifyContent: "center",
  },
  countInput: {
    flex: 1,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    height: 44,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    paddingHorizontal: SPACING.md,
    textAlign: "left",
  },

  /* Chips */
  separatorRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  sepChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  sepChipText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  /* Results */
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
