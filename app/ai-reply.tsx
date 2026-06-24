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
import {
  RADIUS,
  RADIUS_SM,
  SPACING,
  CONTENT_BOTTOM_PADDING,
  HEADER_PADDING_TOP,
} from "../constants/layout";

const TONES = ["Professional", "Friendly", "Formal", "Concise"];
const GREEN = "#25D366";

export default function AiReplyScreen() {
  const colors = useColors();
  const [receivedMessage, setReceivedMessage] = useState("");
  const [tone, setTone] = useState("Professional");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!receivedMessage.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const response = await chat(
        `You received this WhatsApp message: "${receivedMessage}". Generate 3 different reply suggestions in a ${tone.toLowerCase()} tone. Number them 1, 2, 3. Keep each reply concise and suitable for WhatsApp. Just output the suggestions, no extra conversation or introduction.`,
      );
      setResult(response);
      await addHistory("AI Reply", response);
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              AI Reply Generator
            </Text>
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
        {/* ── Received Message Card ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              RECEIVED MESSAGE
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.inputBorder,
                },
              ]}
              placeholder="Paste the message you received..."
              placeholderTextColor={colors.mutedForeground}
              value={receivedMessage}
              onChangeText={setReceivedMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Reply Tone Card ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REPLY TONE</Text>
            <View style={styles.chipRow}>
              {TONES.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.chip,
                    tone === item
                      ? styles.chipSelected
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setTone(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      tone === item ? styles.chipTextSelected : { color: colors.foreground },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* ── API Key Warning ── */}
        <View style={styles.sectionWrap}>
          <ApiKeyWarning />
        </View>

        {/* ── Generate Button ── */}
        <View style={styles.sectionWrap}>
          <Pressable
            style={[
              styles.generateBtn,
              {
                backgroundColor: loading ? colors.muted : GREEN,
                opacity: loading || !receivedMessage.trim() ? 0.7 : 1,
              },
            ]}
            onPress={handleGenerate}
            disabled={loading || !receivedMessage.trim()}
          >
            {loading ? (
              <LoadingSpinner size="small" color="#FFF" />
            ) : (
              <>
                <Feather name="zap" size={18} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Generate Replies</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ── Error ── */}
        {error ? (
          <View style={styles.sectionWrap}>
            <AiErrorBox error={error} onDismiss={() => setError("")} />
          </View>
        ) : null}

        {/* ── Result ── */}
        {result ? (
          <View style={styles.sectionWrap}>
            <ResultCard result={result} />
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

  /* Sections */
  sectionWrap: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },

  /* Card */
  card: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  /* Section Label */
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },

  /* Chips */
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },

  /* Text Input */
  textInput: {
    minHeight: 100,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  /* Generate Button */
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    height: 52,
    borderRadius: RADIUS,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
});
