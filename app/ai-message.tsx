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
import {
  RADIUS,
  RADIUS_SM,
  SPACING,
  CONTENT_BOTTOM_PADDING,
  HEADER_PADDING_TOP,
} from "../constants/layout";

// ── Data ──────────────────────────────────────────────────────────

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Wedding",
  "Business",
  "Thank You",
  "Apology",
  "Congratulations",
  "Get Well",
  "New Year",
  "Eid",
  "Diwali",
  "Christmas",
  "Farewell",
  "Love",
  "Friendship",
];

const TONES = ["Professional", "Friendly", "Formal", "Funny", "Romantic", "Casual", "Emotional"];

const LANGUAGES = [
  "English",
  "Hindi",
  "Gujarati",
  "Kannada",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Urdu",
  "Punjabi",
  "Malayalam",
  "Spanish",
  "French",
  "Arabic",
];

const GREEN = "#25D366";

// ── Component ─────────────────────────────────────────────────────

export default function AiMessageScreen() {
  const colors = useColors();
  const [occasion, setOccasion] = useState("Birthday");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [isFav, setIsFav] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult("");
    setIsFav(false);
    try {
      const recipientPart = recipient.trim() ? ` The message is for ${recipient.trim()}.` : "";
      const wordLimitPart = wordCount.trim() ? ` Make the message approximately ${wordCount.trim()} words long.` : " Keep it concise, engaging, and suitable for WhatsApp.";
      const prompt = `Generate a ${tone.toLowerCase()} WhatsApp message for a ${occasion.toLowerCase()} occasion.${recipientPart}${wordLimitPart} Write in ${language}. Just output the message, no explanation or quotation marks.`;
      const response = await chat(prompt);
      setResult(response);
      await addHistory("AI Message", response);
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
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Message</Text>
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
        {/* ── Occasion ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OCCASION</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {OCCASIONS.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.chip,
                    occasion === item
                      ? styles.chipSelected
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setOccasion(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      occasion === item ? styles.chipTextSelected : { color: colors.foreground },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── Recipient Name ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              RECIPIENT NAME (OPTIONAL)
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
              placeholder="e.g. John, Mom, Rahul..."
              placeholderTextColor={colors.mutedForeground}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>
        {/* ── Word Count ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              MESSAGE LENGTH IN WORDS (OPTIONAL)
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
              placeholder="e.g. 50, 100, 200..."
              placeholderTextColor={colors.mutedForeground}
              value={wordCount}
              onChangeText={setWordCount}
              keyboardType="number-pad"
              autoCorrect={false}
            />
          </View>
        </View>
        {/* ── Tone ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TONE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
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
            </ScrollView>
          </View>
        </View>

        {/* ── Language ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LANGUAGE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {LANGUAGES.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.chip,
                    language === item
                      ? styles.chipSelected
                      : { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => setLanguage(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      language === item ? styles.chipTextSelected : { color: colors.foreground },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
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
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" color="#FFF" />
            ) : (
              <>
                <Feather name="zap" size={18} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Generate Message</Text>
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
            <ResultCard
              result={result}
              isFavorite={isFav}
              onToggleFavorite={async () => {
                const toggled = await toggleFavoriteHistoryItemByText(result, "AI Message");
                setIsFav(toggled);
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

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
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },

  /* Text Input */
  textInput: {
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
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
