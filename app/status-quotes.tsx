import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { EmptyState } from "../components/EmptyState";
import { useColors } from "../lib/useColors";
import { RADIUS, SPACING, CONTENT_BOTTOM_PADDING, HEADER_PADDING_TOP } from "../constants/layout";
import { QUOTE_CATEGORIES } from "../constants/quotes";
import { getFavoriteQuotes, toggleFavoriteQuote } from "../lib/storage";

export default function StatusQuotesScreen() {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

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

        {/* Quotes */}
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
});
