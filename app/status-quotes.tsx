import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { EmptyState } from "../components/EmptyState";
import { useColors } from "../lib/useColors";
import { RADIUS, RADIUS_SM, SPACING, CONTENT_BOTTOM_PADDING, HEADER_PADDING_TOP } from "../constants/layout";
import { QUOTE_CATEGORIES } from "../constants/quotes";
import { getFavoriteQuotes, toggleFavoriteQuote } from "../lib/storage";
import { chat } from "../lib/openai";
import { ApiKeyWarning } from "../components/ApiKeyWarning";

const LANGUAGES = [
  "English",
  "Hindi",
  "Hinglish",
  "Gujarati",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Punjabi",
  "Spanish",
  "French",
];

export default function StatusQuotesScreen() {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  // AI status generation state
  const [aiTopic, setAiTopic] = useState("");
  const [aiLanguage, setAiLanguage] = useState("English");
  const [aiQuotes, setAiQuotes] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerateAiQuotes = useCallback(async () => {
    if (!aiTopic.trim()) return;
    try {
      setLoadingAi(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const prompt = `Generate 5 creative, short WhatsApp status quotes/captions about "${aiTopic.trim()}" in ${aiLanguage || "English"}.
Provide ONLY a valid JSON array of strings, for example:
["quote 1", "quote 2", "quote 3", "quote 4", "quote 5"]
Do not include any other markdown formatting, code block markers, or introductory text. Just the raw JSON.`;

      const responseText = await chat(prompt);

      // Clean potential JSON markdown wrapper if any
      let cleanedJson = responseText.trim();
      if (cleanedJson.startsWith("```json")) {
        cleanedJson = cleanedJson.substring(7);
      } else if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.substring(3);
      }
      if (cleanedJson.endsWith("```")) {
        cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
      }
      cleanedJson = cleanedJson.trim();

      const parsed = JSON.parse(cleanedJson);
      if (Array.isArray(parsed)) {
        setAiQuotes(parsed.map((q) => q.toString()));
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error(err);
      if (err instanceof SyntaxError) {
        Alert.alert("AI Error", "Failed to parse AI response. Please try again.");
      } else {
        Alert.alert("AI Error", err.message || "An error occurred while generating quotes.");
      }
    } finally {
      setLoadingAi(false);
    }
  }, [aiTopic, aiLanguage]);

  useEffect(() => {
    (async () => {
      const favs = await getFavoriteQuotes();
      setFavorites(new Set(favs));
    })();
  }, []);

  const handleToggleFav = useCallback(
    async (quote: string) => {
      const isFav = favorites.has(quote);
      await toggleFavoriteQuote(quote);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(quote);
        else next.add(quote);
        return next;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [favorites],
  );

  const handleCopy = useCallback(async (quote: string) => {
    await Clipboard.setStringAsync(quote);
    setCopied(quote);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const selectedCat = selectedCategory
    ? QUOTE_CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  const quotes = selectedCat ? selectedCat.quotes : favorites.size > 0 ? [...favorites] : [];
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
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Status Quotes</Text>
            <View style={{ width: 34 }} />
          </View>
        )}
      </SafeAreaInsetsContext.Consumer>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: CONTENT_BOTTOM_PADDING + SPACING.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <Pressable
            style={[
              styles.categoryChip,
              {
                backgroundColor: !selectedCategory ? `${colors.primary}20` : colors.card,
                borderColor: !selectedCategory ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: !selectedCategory ? colors.primary : colors.mutedForeground },
              ]}
            >
              ⭐ Favorites
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === "ai" ? `${colors.primary}20` : colors.card,
                borderColor: selectedCategory === "ai" ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedCategory(selectedCategory === "ai" ? null : "ai")}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: selectedCategory === "ai" ? colors.primary : colors.mutedForeground },
              ]}
            >
              🤖 AI Generator
            </Text>
          </Pressable>
          {QUOTE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === cat.id ? `${colors.primary}20` : colors.card,
                  borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color: selectedCategory === cat.id ? colors.primary : colors.mutedForeground,
                  },
                ]}
              >
                {cat.emoji} {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Quotes or AI Generator */}
        {selectedCategory === "ai" ? (
          <View style={styles.aiContainer}>
            <View
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {/* Topic Input Group */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  TOPIC / KEYWORD
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
                  placeholder="e.g., Motivation, Friendship, Rainy Day..."
                  placeholderTextColor={colors.mutedForeground}
                  value={aiTopic}
                  onChangeText={setAiTopic}
                />
              </View>

              {/* Language Scroll Group */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                  LANGUAGE (OPTIONAL, DEFAULTS TO ENGLISH)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.langChipRow}
                >
                  {LANGUAGES.map((lang) => (
                    <Pressable
                      key={lang}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor: aiLanguage === lang ? `${colors.primary}20` : colors.muted,
                          borderColor: aiLanguage === lang ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setAiLanguage(lang)}
                    >
                      <Text
                        style={[
                          styles.langChipText,
                          {
                            color: aiLanguage === lang ? colors.primary : colors.foreground,
                          },
                        ]}
                      >
                        {lang}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <Pressable
                style={[
                  styles.generateBtn,
                  {
                    backgroundColor: !aiTopic.trim() || loadingAi ? colors.border : colors.primary,
                  },
                  (!aiTopic.trim() || loadingAi) && {
                    shadowOpacity: 0,
                    elevation: 0,
                  },
                ]}
                onPress={handleGenerateAiQuotes}
                disabled={!aiTopic.trim() || loadingAi}
              >
                {loadingAi ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Feather name="zap" size={16} color={colors.primaryForeground} />
                    <Text
                      style={[
                        styles.generateBtnText,
                        {
                          color:
                            !aiTopic.trim() || loadingAi
                              ? colors.mutedForeground
                              : colors.primaryForeground,
                        },
                      ]}
                    >
                      Generate Quotes
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.md }}>
              <ApiKeyWarning />
            </View>

            {/* Generated quotes display */}
            {aiQuotes.length > 0 && (
              <View style={[styles.quotesSection, { marginTop: SPACING.lg }]}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.mutedForeground, marginBottom: SPACING.sm },
                  ]}
                >
                  GENERATED QUOTES
                </Text>
                {aiQuotes.map((quote, idx) => (
                  <View
                    key={`ai-${idx}`}
                    style={[
                      styles.quoteCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.quoteText, { color: colors.foreground }]}>{quote}</Text>
                    <View style={styles.quoteActions}>
                      <Pressable hitSlop={8} onPress={() => handleCopy(quote)}>
                        <Feather
                          name={copied === quote ? "check" : "copy"}
                          size={16}
                          color={copied === quote ? colors.primary : colors.mutedForeground}
                        />
                      </Pressable>
                      <Pressable hitSlop={8} onPress={() => handleToggleFav(quote)}>
                        <Feather
                          name="heart"
                          size={16}
                          color={favorites.has(quote) ? "#EF4444" : colors.mutedForeground}
                          fill={favorites.has(quote) ? "#EF4444" : "transparent"}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.quotesSection}>
            {quotes.length === 0 ? (
              <EmptyState
                icon="heart"
                title="No favorites yet"
                subtitle="Browse categories and tap the heart to save quotes"
              />
            ) : (
              quotes.map((quote, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.quoteCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.quoteText, { color: colors.foreground }]}>{quote}</Text>
                  <View style={styles.quoteActions}>
                    <Pressable hitSlop={8} onPress={() => handleCopy(quote)}>
                      <Feather
                        name={copied === quote ? "check" : "copy"}
                        size={16}
                        color={copied === quote ? colors.primary : colors.mutedForeground}
                      />
                    </Pressable>
                    <Pressable hitSlop={8} onPress={() => handleToggleFav(quote)}>
                      <Feather
                        name="heart"
                        size={16}
                        color={favorites.has(quote) ? "#EF4444" : colors.mutedForeground}
                        fill={favorites.has(quote) ? "#EF4444" : "transparent"}
                      />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
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

  /* Categories */
  categoryRow: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: "center",
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  /* Quotes */
  quotesSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  quoteCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
  },
  quoteText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  quoteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.lg,
  },

  /* AI Generator styles */
  aiContainer: {},
  card: {
    borderRadius: RADIUS,
    borderWidth: 1,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  textInput: {
    height: 48,
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  langChipRow: {
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    height: 52,
    borderRadius: RADIUS,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
});
