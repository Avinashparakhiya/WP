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
import { addHistory, toggleFavoriteHistoryItemByText } from "../lib/storage";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
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
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setReceivedMessage(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleGenerate = async () => {
    if (!receivedMessage.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    setFavoritesMap({});
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

  const parseSuggestions = (text: string): string[] => {
    if (!text) return [];
    const lines = text.split(/\r?\n/);
    const suggestions: string[] = [];
    for (let line of lines) {
      let trimmed = line.trim();
      if (!trimmed) continue;
      trimmed = trimmed.replace(/^[0-9]+[\.\)]\s*/, "");
      trimmed = trimmed.replace(/^[\-\*]\s*/, "");
      trimmed = trimmed.replace(/^["']|["']$/g, "").trim();
      if (trimmed) {
        suggestions.push(trimmed);
      }
    }
    return suggestions.length > 0 ? suggestions : [text.trim()];
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
            <View style={styles.labelRow}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                RECEIVED MESSAGE
              </Text>
              <Pressable onPress={handlePaste} style={styles.pasteBtn} hitSlop={8}>
                <Feather name="clipboard" size={14} color={colors.primary} />
                <Text style={[styles.pasteBtnText, { color: colors.primary }]}>Paste</Text>
              </Pressable>
            </View>
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
          <View style={{ gap: SPACING.md, marginTop: SPACING.sm }}>
            {parseSuggestions(result).map((suggestion, index) => {
              const isFavorite = !!favoritesMap[suggestion];
              return (
                <View key={index} style={styles.sectionWrap}>
                  <Text style={[styles.resultBadge, { color: colors.mutedForeground }]}>
                    REPLY OPTION {index + 1}
                  </Text>
                  <ResultCard
                    result={suggestion}
                    isFavorite={isFavorite}
                    onToggleFavorite={async () => {
                      const toggled = await toggleFavoriteHistoryItemByText(suggestion, "AI Reply");
                      setFavoritesMap((prev) => ({ ...prev, [suggestion]: toggled }));
                    }}
                  />
                </View>
              );
            })}
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

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  pasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  pasteBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
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
  resultBadge: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
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
