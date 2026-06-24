import React, { useState } from "react";
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
import { ResultCard } from "../components/ResultCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AiErrorBox } from "../components/AiErrorBox";
import { ApiKeyWarning } from "../components/ApiKeyWarning";
import { useColors } from "../lib/useColors";
import { chat } from "../lib/openai";
import { addHistory } from "../lib/storage";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING, HEADER_PADDING_TOP } from "../constants/layout";

const BUSINESS_TYPES = [
  { id: "sales", label: "Sales", emoji: "\u{1F4B0}" },
  { id: "marketing", label: "Marketing", emoji: "\u{1F4E3}" },
  { id: "support", label: "Support", emoji: "\u{1F6E0}\u{FE0F}" },
  { id: "promotion", label: "Promotion", emoji: "\u{1F4E1}" },
  { id: "followup", label: "Follow-up", emoji: "\u{1F504}" },
  { id: "apology", label: "Apology", emoji: "\u{1F64F}" },
];

export default function AiAssistantScreen() {
  const colors = useColors();
  const [businessType, setBusinessType] = useState("");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!businessType || !prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const selected = BUSINESS_TYPES.find((b) => b.id === businessType);
      const response = await chat(
        `Write a professional WhatsApp ${selected?.label.toLowerCase() ?? businessType} message for this scenario: "${prompt.trim()}". Keep it concise, friendly, and suitable for WhatsApp. Just output the message, no explanation.`,
      );
      setResult(response);
      await addHistory("AI Assistant", response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("API key not set") && !msg.includes("API key required")) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Assistant</Text>
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
          <Text style={[styles.label, { color: colors.foreground }]}>Message type</Text>
          <View style={styles.chipsRow}>
            {BUSINESS_TYPES.map((bt) => (
              <Pressable
                key={bt.id}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: businessType === bt.id ? `${colors.primary}20` : colors.card,
                    borderColor: businessType === bt.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setBusinessType(bt.id)}
              >
                <Text style={styles.typeChipEmoji}>{bt.emoji}</Text>
                <Text
                  style={[
                    styles.typeChipText,
                    {
                      color: businessType === bt.id ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {bt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>Describe your scenario</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.inputBorder,
              },
            ]}
            placeholder="e.g., Customer complained about late delivery, need to offer a discount..."
            placeholderTextColor={colors.mutedForeground}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <ApiKeyWarning />

          <Pressable
            style={[styles.button, { backgroundColor: loading ? colors.muted : colors.primary }]}
            onPress={handleGenerate}
            disabled={loading || !businessType || !prompt.trim()}
          >
            {loading ? (
              <LoadingSpinner size="small" color={colors.mutedForeground} />
            ) : (
              <>
                <Feather name="briefcase" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Generate Message</Text>
              </>
            )}
          </Pressable>
        </View>

        {error ? <AiErrorBox error={error} onDismiss={() => setError("")} /> : null}
        {result ? <ResultCard result={result} /> : null}
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
  inputSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipEmoji: { fontSize: 14 },
  typeChipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderRadius: RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
